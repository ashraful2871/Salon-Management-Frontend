/* eslint-disable @typescript-eslint/no-explicit-any */
export const registerUser = async (
  _currentState: unknown,
  formData: FormData,
): Promise<any> => {
  try {
    const role = formData.get("isSalonOwner") ? "SALON_OWNER" : "CUSTOMER";

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      phoneNumber: formData.get("phoneNumber"),
      gender: formData.get("gender"),
      ...(role === "SALON_OWNER" && { role }),
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    return await res.json();
  } catch (error) {
    console.error("registerUser error:", error);
    return {
      success: false,
      message: "Registration failed. Please try again.",
    };
  }
};
