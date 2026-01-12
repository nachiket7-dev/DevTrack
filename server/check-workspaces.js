import prisma from "./configs/prisma.js";

async function checkWorkspaces() {
    console.log("🔍 Checking Workspaces in Database...");
    const workspaces = await prisma.workspace.findMany({
        include: {
            members: {
                select: { userId: true }
            }
        }
    });

    console.log(`Found ${workspaces.length} workspaces:`);
    workspaces.forEach(w => {
        console.log(`- [${w.name}] (ID: ${w.id}) | Members: ${w.members.length}`);
    });
}

checkWorkspaces()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
