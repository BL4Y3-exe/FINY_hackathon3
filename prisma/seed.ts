/**
 * Seed file for local development and hackathon demo.
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PeerWeave database…");

  // ── Demo community ─────────────────────────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { email: "alice@demo.peerweave.io" },
    update: {},
    create: {
      email: "alice@demo.peerweave.io",
      name: "Alice Chen",
      profile: {
        create: {
          bio: "Full-stack engineer building community tooling.",
          goals: "Find designers and marketers to collaborate with.",
          timezone: "America/New_York",
          skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
          interests: ["open source", "community building", "hackathons"],
        },
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@demo.peerweave.io" },
    update: {},
    create: {
      email: "bob@demo.peerweave.io",
      name: "Bob Müller",
      profile: {
        create: {
          bio: "Product designer with a passion for UX systems.",
          goals: "Ship more side projects and find technical co-founders.",
          timezone: "Europe/Berlin",
          skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
          interests: ["design", "open source", "startups"],
        },
      },
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@demo.peerweave.io" },
    update: {},
    create: {
      email: "carol@demo.peerweave.io",
      name: "Carol Smith",
      profile: {
        create: {
          bio: "Growth marketer & community strategist.",
          goals: "Learn about AI/ML and connect with engineers.",
          timezone: "America/Los_Angeles",
          skills: ["Marketing", "SEO", "Content Strategy", "Analytics"],
          interests: ["growth", "community building", "AI/ML"],
        },
      },
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: "dave@demo.peerweave.io" },
    update: {},
    create: {
      email: "dave@demo.peerweave.io",
      name: "Dave Okafor",
      profile: {
        create: {
          bio: "ML engineer working on recommendation systems.",
          goals: "Build a startup in the edtech space.",
          timezone: "Europe/London",
          skills: ["Python", "AI/ML", "TensorFlow", "Data Science"],
          interests: ["AI/ML", "edtech", "hackathons", "open source"],
        },
      },
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: "eve@demo.peerweave.io" },
    update: {},
    create: {
      email: "eve@demo.peerweave.io",
      name: "Eve Tanaka",
      profile: {
        create: {
          bio: "Backend engineer & DevOps enthusiast.",
          goals: "Level up on frontend skills and product thinking.",
          timezone: "Asia/Tokyo",
          skills: ["Python", "DevOps", "Kubernetes", "Go"],
          interests: ["DevOps", "open source", "community building"],
        },
      },
    },
  });

  // ── Community ──────────────────────────────────────────────────────────────
  const community = await prisma.community.upsert({
    where: { slug: "demo-builders" },
    update: {},
    create: {
      name: "Demo Builders",
      slug: "demo-builders",
      description: "A demo community for the PeerWeave hackathon showcase.",
      ownerId: alice.id,
    },
  });

  // ── Memberships ────────────────────────────────────────────────────────────
  for (const [user, role] of [
    [alice, "ADMIN"],
    [bob, "MEMBER"],
    [carol, "MEMBER"],
    [dave, "MEMBER"],
    [eve, "MEMBER"],
  ] as const) {
    await prisma.membership.upsert({
      where: { userId_communityId: { userId: user.id, communityId: community.id } },
      update: {},
      create: { userId: user.id, communityId: community.id, role },
    });
  }

  // ── Connections ────────────────────────────────────────────────────────────
  const connectionPairs: [string, string, "MATCH" | "HELP" | "BUDDY"][] = [
    [alice.id, bob.id, "MATCH"],
    [alice.id, dave.id, "HELP"],
    [bob.id, carol.id, "BUDDY"],
    [carol.id, dave.id, "MATCH"],
  ];

  for (const [a, b, type] of connectionPairs) {
    const [userAId, userBId] = [a, b].sort();
    await prisma.connection.upsert({
      where: { userAId_userBId_type: { userAId, userBId, type } },
      update: {},
      create: { userAId, userBId, type, weight: 1 },
    });
  }

  // ── Interactions ───────────────────────────────────────────────────────────
  await prisma.interaction.createMany({
    data: [
      { type: "MATCH", actorId: alice.id, targetId: bob.id, communityId: community.id },
      { type: "HELP", actorId: dave.id, targetId: alice.id, communityId: community.id },
      { type: "BUDDY_ASSIGNED", actorId: bob.id, targetId: carol.id, communityId: community.id },
      { type: "MATCH", actorId: carol.id, targetId: dave.id, communityId: community.id },
    ],
    skipDuplicates: true,
  });

  // ── Help request ───────────────────────────────────────────────────────────
  const helpReq = await prisma.helpRequest.create({
    data: {
      title: "How do I optimise React re-renders in a large list?",
      description:
        "I have a list of ~1000 items that re-renders on every keystroke because the parent state changes. I've tried useMemo but it doesn't seem to help. Any ideas?",
      tags: ["React", "TypeScript", "Performance"],
      authorId: alice.id,
      communityId: community.id,
      status: "OPEN",
    },
  });

  await prisma.helpResponse.create({
    data: {
      requestId: helpReq.id,
      helperId: dave.id,
      message:
        "Try wrapping your list item component in React.memo() and passing a stable key. Also consider react-window or react-virtualized for truly large lists.",
    },
  });

  // ── Buddy assignment ───────────────────────────────────────────────────────
  await prisma.buddyAssignment.upsert({
    where: {
      id: (
        await prisma.buddyAssignment.findFirst({
          where: { newUserId: carol.id, communityId: community.id },
        })
      )?.id ?? "__nonexistent__",
    },
    update: {},
    create: { newUserId: carol.id, buddyUserId: bob.id, communityId: community.id },
  });

  console.log("✅ Seeding complete!");
  console.log(`   Community: ${community.name} (slug: ${community.slug})`);
  console.log(`   Users: Alice, Bob, Carol, Dave, Eve`);
  console.log(`   1 help request, 4 connections, 4 interactions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
