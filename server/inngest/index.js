import { Inngest } from "inngest";
import prisma from "../prisma"; // Assuming Prisma is set up in your project

// Load environment variables
const inngestEventKey = process.env.INNGEST_EVENT_KEY;
const inngestSigningKey = process.env.INNGEST_SIGNING_KEY;

// Check if Inngest keys are missing
if (!inngestEventKey || !inngestSigningKey) {
    console.warn("Inngest keys are missing. Inngest functions will not be executed.");
}

// Initialize Inngest client
const inngest = new Inngest({
    name: "My Backend App", // Replace with your app name
    eventKey: inngestEventKey,
    signingKey: inngestSigningKey,
});

// Inngest functions
const syncUserCreation = inngestEventKey && inngestSigningKey
    ? inngest.createFunction(
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
    )
    : async () => {
        console.warn("Skipping syncUserCreation because Inngest keys are missing.");
    };

const syncUserDeletion = inngestEventKey && inngestSigningKey
    ? inngest.createFunction(
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
    )
    : async () => {
        console.warn("Skipping syncUserDeletion because Inngest keys are missing.");
    };

const syncUserUpdation = inngestEventKey && inngestSigningKey
    ? inngest.createFunction(
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
    )
    : async () => {
        console.warn("Skipping syncUserUpdation because Inngest keys are missing.");
    };

// Additional Inngest functions (e.g., workspace creation, deletion, etc.)
// Add similar functions for workspace creation, updation, deletion, etc., as needed.

const syncWorkspaceCreation = async () => {
    console.warn("Skipping syncWorkspaceCreation because Inngest keys are missing.");
};

const syncWorkspaceUpdation = async () => {
    console.warn("Skipping syncWorkspaceUpdation because Inngest keys are missing.");
};

const syncWorkspaceDeletion = async () => {
    console.warn("Skipping syncWorkspaceDeletion because Inngest keys are missing.");
};

const syncWorkspaceMemberCreation = async () => {
    console.warn("Skipping syncWorkspaceMemberCreation because Inngest keys are missing.");
};

const sendBookingConfirmationEmail = async () => {
    console.warn("Skipping sendBookingConfirmationEmail because Inngest keys are missing.");
};

// Export Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendBookingConfirmationEmail,
];