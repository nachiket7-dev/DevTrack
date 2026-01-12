import { Inngest } from "inngest";
import prisma from "../configs/prisma.js"; 

// Load environment variables
const inngestEventKey = process.env.INNGEST_EVENT_KEY;
const inngestSigningKey = process.env.INNGEST_SIGNING_KEY;

// Check if Inngest keys are missing
if (!inngestEventKey || !inngestSigningKey) {
    console.warn("Inngest keys are missing. Inngest functions will not be executed.");
}

// Initialize Inngest client
export const inngest = new Inngest({
    id: "my-backend-app", // Unique App ID
    name: "My Backend App",
    eventKey: inngestEventKey,
    signingKey: inngestSigningKey,
});

// Inngest functions
const syncUserCreation = inngest.createFunction(
    { id: "create-user-with-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: `${data?.first_name} ${data?.last_name}`,
                image: data?.image_url,
            },
        });
        console.log(`User with ID ${data.id} created successfully.`);
    }
);

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({
            where: {
                id: data.id,
            },
        });
        console.log(`User with ID ${data.id} deleted successfully.`);
    }
);

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: `${data?.first_name} ${data?.last_name}`,
                image: data?.image_url,
            },
        });
        console.log(`User with ID ${data.id} updated successfully.`);
    }
);

// Workspace Functions
const syncWorkspaceCreation = inngest.createFunction(
    { id: "create-workspace-from-clerk" },
    { event: "clerk/organization.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                image_url: data.image_url || "",
                ownerId: data.created_by,
            },
        });
        console.log(`Workspace ${data.id} created successfully.`);
    }
);

const syncWorkspaceUpdation = inngest.createFunction(
    { id: "update-workspace-from-clerk" },
    { event: "clerk/organization.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.update({
            where: { id: data.id },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url || "",
            },
        });
        console.log(`Workspace ${data.id} updated successfully.`);
    }
);

const syncWorkspaceDeletion = inngest.createFunction(
    { id: "delete-workspace-from-clerk" },
    { event: "clerk/organization.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({
            where: { id: data.id },
        });
        console.log(`Workspace ${data.id} deleted successfully.`);
    }
);

const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: "create-workspace-member-from-clerk" },
    { event: "clerk/organizationMembership.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspaceMember.create({
            data: {
                id: data.id,
                workspaceId: data.organization.id,
                userId: data.public_user_data.user_id,
                role: data.role === "org:admin" ? "ADMIN" : "MEMBER",
            },
        });
        console.log(`Member added to workspace ${data.organization.id} successfully.`);
    }
);

// Export Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
];

