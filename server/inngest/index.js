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

        try {
            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data?.email_addresses[0]?.email_address,
                    name: `${data?.first_name} ${data?.last_name}`,
                    image: data?.image_url,
                },
            });
            console.log(`User with ID ${data.id} created successfully.`);
        } catch (error) {
            console.error(`Failed to create user with ID ${data.id}:`, error);
        }
    }
);

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event;

        try {
            await prisma.user.delete({
                where: {
                    id: data.id,
                },
            });
            console.log(`User with ID ${data.id} deleted successfully.`);
        } catch (error) {
            console.error(`Failed to delete user with ID ${data.id}:`, error);
        }
    }
);

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event;

        try {
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
        } catch (error) {
            console.error(`Failed to update user with ID ${data.id}:`, error);
        }
    }
);

// Export Inngest functions
// Only exporting valid Inngest functions. 
// Placeholders for syncWorkspace* were causing crashes because they were raw async functions, not inngest functions.
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
];