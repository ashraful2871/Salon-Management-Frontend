/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
export const registerUser = async (
  _currentSate: any,
  formData: any
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
      ...(role === "SALON_OWNER" && { role: role }),
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    return res.json();
  } catch (error) {
    console.log(error);
  }
};
