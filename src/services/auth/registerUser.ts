/* eslint-disable @typescript-eslint/no-explicit-any */
export const registerUser = async (
  _currentState: unknown,
  formData: FormData,
): Promise<any> => {
  let payload;
  try {
    const role = formData.get("isSalonOwner") ? "SALON_OWNER" : "CUSTOMER";

    payload = {
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

    const result = await res.json();
    return { ...result, inputs: payload };
  } catch (error) {
    console.error("registerUser error:", error);
    return {
      success: false,
      message: "Registration failed. Please try again.",
      inputs: payload,
    };
  }
};
