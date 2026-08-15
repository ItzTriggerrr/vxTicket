export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { resend } from "../../../../lib/resend";

function getBase64SizeInMB(base64String: string): number {
  if (!base64String) return 0;
  const base64Content = base64String.split(",")[1] || base64String;
  const sizeInBytes = (base64Content.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // ─── SCENARIO A: SINGLE EVENT DETAILS VIEW ───────────────────────────
    if (id) {
      const event = await prisma.eventListing.findUnique({
        where: { id },
        include: {
          ticketTiers: true,
          lineup: true,
        },
      });

      if (!event) {
        return NextResponse.json({ error: "Event listing not discovered." }, { status: 404 });
      }

      const formattedEvent = {
        ...event,
        tiers: event.ticketTiers,
      };

      return NextResponse.json({ success: true, event: formattedEvent }, { status: 200 });
    }

    // ─── SCENARIO B: LIGHTWEIGHT HIGH-SPEED FEED INVENTORY ─────────────────
    const now = new Date();

    const eventsRaw = await prisma.eventListing.findMany({
      where: { 
        status: "PUBLISHED",
        OR: [
          { endDate: { gte: now } },
          { endDate: null, startDate: { gte: now } }
        ]
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        startDate: true,
        endDate: true,
        startTime: true,
        venueName: true,
        city: true,
        coverImage: true,
        status: true,
        isHero: true,
        isFeatured: true,
        isPopular: true,
        ticketTiers: {
          where: { isHidden: false },
          select: {
            id: true,
            name: true,
            price: true,
            capacity: true,
            sold: true,
            isFree: true,
            isHidden: true,
          },
        },
      },
    });

    const eventsWithTiers = eventsRaw.map((event) => ({
      ...event,
      tiers: event.ticketTiers,
    }));

    const heroEvent = eventsWithTiers.find((e: any) => e.isHero === true) || null;
    const featuredEvents = [...eventsWithTiers].slice(0, 4);
    const popularEvents = eventsWithTiers;

    return NextResponse.json(
      { 
        success: true, 
        hero: heroEvent,
        featured: featuredEvents,
        popular: popularEvents,
        all: eventsWithTiers 
      }, 
      { 
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59"
        }
      }
    );

  } catch (error: any) {
    console.error("❌ Feed intelligence compilation fault:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST HANDLER FOR UPDATING & CREATING LISTINGS WITH SAFEGUARD LOGIC ─────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      providerId,
      title,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      venueName,
      address,
      city,
      coverImage,
      gallery,
      status,
      tiers,
      lineup,       
      host,         
      customField1  
    } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Authentication Missing." }, { status: 400 });
    }

    const MAX_IMAGE_SIZE_MB = 4.0;

    if (coverImage) {
      const coverSize = getBase64SizeInMB(coverImage);
      if (coverSize > MAX_IMAGE_SIZE_MB) {
        return NextResponse.json(
          { error: `The primary cover flyer is too large (${coverSize.toFixed(2)}MB). Please upload an image under ${MAX_IMAGE_SIZE_MB}MB.` },
          { status: 413 }
        );
      }
    }

    if (gallery && Array.isArray(gallery)) {
      for (let i = 0; i < gallery.length; i++) {
        const img = gallery[i];
        if (img) {
          const gallerySize = getBase64SizeInMB(img);
          if (gallerySize > MAX_IMAGE_SIZE_MB) {
            return NextResponse.json(
              { error: `Gallery image #${i + 1} is too large (${gallerySize.toFixed(2)}MB). Please upload images under ${MAX_IMAGE_SIZE_MB}MB.` },
              { status: 413 }
            );
          }
        }
      }
    }

    const userExists = await prisma.user.findUnique({ 
      where: { id: providerId }, 
      include: { providerProfile: true } 
    });
    
    if (!userExists) {
      return NextResponse.json({ error: "Stale user session profile reference." }, { status: 444 });
    }

    const parseIncomingDate = (dateVal: any) => {
      if (!dateVal || dateVal === "Unset") return null;
      const parsed = new Date(dateVal);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const existingRecord = id ? await prisma.eventListing.findUnique({ 
      where: { id },
      include: { ticketTiers: true }
    }) : null;

    const formattedCategory = category ? category.trim() : "OTHER";
    const parsedStartDate = parseIncomingDate(startDate) || new Date();
    const parsedEndDate = parseIncomingDate(endDate);

    let eventListing: any;

    // ─── 🛡️ UPDATE EXISTING EVENT ──────────────────────────────────────
    if (id && existingRecord) {
      const auditLogsToCreate: Array<{ fieldChanged: string; oldValue: string; newValue: string }> = [];

      // Detect Date Change
      if (existingRecord.startDate.toISOString() !== parsedStartDate.toISOString()) {
        auditLogsToCreate.push({
          fieldChanged: "START_DATE",
          oldValue: existingRecord.startDate.toISOString(),
          newValue: parsedStartDate.toISOString(),
        });
      }

      // Detect Time Change
      if (existingRecord.startTime !== startTime) {
        auditLogsToCreate.push({
          fieldChanged: "START_TIME",
          oldValue: existingRecord.startTime || "",
          newValue: startTime || "",
        });
      }

      // Detect Venue / Address Change
      if (existingRecord.venueName !== venueName || existingRecord.address !== address) {
        auditLogsToCreate.push({
          fieldChanged: "VENUE_OR_ADDRESS",
          oldValue: `${existingRecord.venueName} (${existingRecord.address})`,
          newValue: `${venueName} (${address})`,
        });
      }

      console.log(`[AUDIT DETECTOR] Critical fields changed count: ${auditLogsToCreate.length}`);

      // Save Audit Logs if critical fields changed
      if (auditLogsToCreate.length > 0) {
        await prisma.eventEditLog.createMany({
          data: auditLogsToCreate.map((log) => ({
            eventId: id,
            updatedBy: providerId,
            fieldChanged: log.fieldChanged,
            oldValue: log.oldValue,
            newValue: log.newValue,
          })),
        });

        // 🚀 ROBUST MULTI-STATUS ORDER QUERY
        const successfulOrders = await prisma.ticketOrder.findMany({
          where: { 
            eventId: id, 
            status: { in: ["Successful", "SUCCESSFUL", "SUCCESS", "COMPLETED", "PAID", "Completed", "Paid"] } 
          },
          include: { customer: true },
        });

        console.log(`[DISPATCH NOTICE] Found ${successfulOrders.length} valid orders for notify dispatch.`);

        if (successfulOrders.length > 0) {
          const providerContact = userExists.providerProfile?.contactEmail || userExists.email;
          const providerPhone = userExists.providerProfile?.contactPhone || userExists.providerProfile?.momoNumber || "N/A";

          for (const order of successfulOrders as any[]) {
            // Safe fallback for customer email across schema variants
            const recipientEmail = order.customer?.email || order.customerEmail || order.email;
            const recipientName = order.customer?.name || order.customerName || order.name || 'Valued Guest';

            if (recipientEmail) {
              try {
                const resendResponse = await resend.emails.send({
                  from: 'vxTicket <updates@vxticket.com>',
                  to: recipientEmail,
                  subject: `Important Event Update: ${existingRecord.title}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; padding: 24px; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px;">
                      <h2 style="color: #22c55e; margin-bottom: 8px;">Event Schedule / Location Updated</h2>
                      <p style="font-size: 15px; color: #444;">Hello <strong>${recipientName}</strong>,</p>
                      <p style="font-size: 14px; color: #555; line-height: 1.5;">
                        The organizer for <strong>${existingRecord.title}</strong> has updated key event details (date, time, or venue).
                      </p>
                      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                      <p style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">Organizer Direct Contact Information:</p>
                      <ul style="font-size: 14px; color: #333; line-height: 1.8;">
                        <li><strong>Support Email:</strong> <a href="mailto:${providerContact}">${providerContact}</a></li>
                        <li><strong>Phone / MoMo:</strong> ${providerPhone}</li>
                      </ul>
                      <div style="margin-top: 24px; padding: 12px 16px; background-color: #f9f9f9; border-left: 4px solid #22c55e; font-size: 12px; color: #666;">
                        <strong>Terms of Service Notice:</strong> read vxTicket Terms of Service, and if there be any inconvenience, please contact the organizer directly.
                      </div>
                    </div>
                  `
                });
                console.log(`✅ Resend Email Dispatched to ${recipientEmail}:`, resendResponse);
              } catch (emailErr) {
                console.error(`❌ Failed to send update notification to ${recipientEmail}:`, emailErr);
              }
            } else {
              console.warn(`⚠️ Order ID ${order.id} missing target email address.`);
            }
          }
        }
      }

      // Update event record
      eventListing = await prisma.eventListing.update({
        where: { id },
        data: {
          title,
          description,
          category: formattedCategory,
          startDate: parsedStartDate as any,
          endDate: parsedEndDate as any,
          startTime,
          endTime,
          venueName,
          address,
          city,
          coverImage,
          gallery,
          status,
          host,
          customField1,
          provider: { connect: { id: providerId } }
        },
      });

      // Update Tiers Safely
      if (tiers && Array.isArray(tiers)) {
        for (const tier of tiers) {
          if (tier.id) {
            await prisma.ticketTier.update({
              where: { id: tier.id },
              data: {
                capacity: parseInt(tier.capacity) || 0,
                isHidden: tier.isHidden ?? false,
                description: tier.description || null,
              },
            });
          } else {
            await prisma.ticketTier.create({
              data: {
                eventId: id,
                name: tier.name || "Standard Admission",
                price: tier.isFree ? 0 : parseFloat(tier.price) || 0,
                capacity: parseInt(tier.capacity) || 0,
                isFree: tier.isFree || false,
                isHidden: tier.isHidden ?? false,
                description: tier.description || null,
              },
            });
          }
        }
      }

      // Clean refresh lineup
      await prisma.artist.deleteMany({ where: { eventId: id } });

    // ─── 🚀 CREATE NEW EVENT ──────────────────────────────────────────
    } else {
      eventListing = await prisma.eventListing.create({
        data: {
          title,
          description,
          category: formattedCategory,
          startDate: parsedStartDate as any,
          endDate: parsedEndDate as any,
          startTime,
          endTime,
          venueName,
          address,
          city,
          coverImage,
          gallery,
          status,
          host,
          customField1,
          provider: { connect: { id: providerId } }
        },
      });

      if (tiers && Array.isArray(tiers) && tiers.length > 0) {
        await prisma.ticketTier.createMany({
          data: tiers.map((tier: any) => ({
            eventId: eventListing.id,
            name: tier.name || "Standard Admission",
            price: tier.isFree ? 0 : parseFloat(tier.price) || 0,
            capacity: parseInt(tier.capacity) || 0,
            isFree: tier.isFree || false,
            isHidden: tier.isHidden || false,
            description: tier.description || null
          })),
        });
      }
    }

    // Process Lineup
    if (lineup && Array.isArray(lineup) && lineup.length > 0) {
      await prisma.artist.createMany({
        data: lineup.map((performer: any) => ({
          eventId: eventListing.id,
          name: performer.name || "Special Guest",
          role: performer.role || null
        })),
      });
    }

    return NextResponse.json({ success: true, event: eventListing }, { status: 200 });
  } catch (error: any) {
    console.error("❌ vxTicket Backend Manager Pipeline Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}