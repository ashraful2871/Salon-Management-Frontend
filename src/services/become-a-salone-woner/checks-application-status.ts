import { serverFetch } from "@/lib/server-fetch";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const checkApplicationsStatus = async () => {
  try {
    const response = await serverFetch.get("/become-salon-owner/me", {
      next: { tags: ["applications-status"] },
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    {
      console.log(error);
      return {
        success: false,
        message: `${
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong"
        }`,
      };
    }
  }
};
