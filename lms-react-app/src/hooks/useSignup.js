import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthcontext } from "../contexts/Authcontext";

const useSignup = () => {
  const [loading, setLoading] = useState(false);

  const { setAuthUser } = useAuthcontext();

  // ============================================================
  // SIGNUP
  // ============================================================

  const signup = async ({
    fullname,
    email,
    username,
    phoneNumber,
    role,
    password,
    confirmPassword,
    institution,

    // ==========================================================
    // AFFILIATE REFERRAL CODE
    // ==========================================================
    referralCode,
  }) => {
    // ==========================================================
    // VALIDATE INPUT
    // ==========================================================

    const success = handleInputErrors({
      fullname,
      email,
      username,
      phoneNumber,
      role,
      password,
      confirmPassword,
    });

    if (!success) return false;

    setLoading(true);

    try {
      // ========================================================
      // PREPARE SIGNUP DATA
      // ========================================================

      const signupData = {
        fullname,
        email,
        username,
        phoneNumber,
        role,
        password,
        confirmPassword,
        institution,

        // ======================================================
        // AFFILIATE REFERRAL CODE
        // ======================================================
        //
        // Example:
        //
        // referralCode: "RAJOHN1234"
        //
        // This will be received by the backend registration
        // controller.
        //
        referralCode: referralCode || null,
      };

      console.log(
        "Signup request:",
        signupData
      );

      // ========================================================
      // SIGNUP API
      // ========================================================

      const res = await fetch(
        "/api/users/sign_up",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(signupData),
        }
      );

      // ========================================================
      // HANDLE HTTP ERROR
      // ========================================================

      if (!res.ok) {
        const errorData = await res.json();

        throw new Error(
          errorData.message ||
          "Signup failed"
        );
      }

      // ========================================================
      // GET RESPONSE
      // ========================================================

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // ========================================================
      // SAVE USER
      // ========================================================

      localStorage.setItem(
        "lms-user",
        JSON.stringify(data)
      );

      setAuthUser(data);

      // ========================================================
      // SUCCESS
      // ========================================================

      return true;

    } catch (error) {

      console.log(
        "The signup error:",
        error
      );

      toast.error(
        error.message
      );

      return false;

    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    signup,
  };
};

export default useSignup;


// ============================================================
// INPUT VALIDATION
// ============================================================

function handleInputErrors({
  fullname,
  email,
  username,
  phoneNumber,
  role,
  password,
  confirmPassword,
}) {

  if (
    !fullname ||
    !email ||
    !username ||
    !phoneNumber ||
    !role ||
    !password ||
    !confirmPassword
  ) {
    toast.error(
      "Please fill all the fields"
    );

    return false;
  }

  if (
    password !== confirmPassword
  ) {
    toast.error(
      "Passwords do not match"
    );

    return false;
  }

  if (
    password.length < 6
  ) {
    toast.error(
      "Password must be at least 6 characters"
    );

    return false;
  }

  return true;
}