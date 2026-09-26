import React, { useState } from "react";
import { Button, Spinner } from "reactstrap";
import toast from "react-hot-toast";
import axios from "axios";

const CoursePayment = ({
  course,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const existingScript =
        document.getElementById(
          "razorpay-checkout-script"
        );

      if (existingScript) {
        resolve(true);
        return;
      }

      const script =
        document.createElement("script");

      script.id =
        "razorpay-checkout-script";

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // =====================================
      // LOAD RAZORPAY
      // =====================================

      const loaded =
        await loadRazorpay();

      if (!loaded) {
        toast.error(
          "Unable to load payment gateway"
        );

        return;
      }

      // =====================================
      // CREATE ORDER
      // =====================================

      const response =
        await axios.post(
          "/api/payments/course/create-order",
          {
            courseId: course._id
          }
        );

      const data = response.data;

      // =====================================
      // OPEN RAZORPAY
      // =====================================

      const options = {
        key: data.key,

        amount: data.amount,

        currency: data.currency,

        name: "Your LMS",

        description:
          course.name,

        order_id:
          data.providerOrderId,

        handler: async function (
          paymentResponse
        ) {
          try {
            // ===============================
            // VERIFY PAYMENT
            // ===============================

            const verifyResponse =
              await axios.post(
                "/api/payments/course/verify",
                {
                  orderId:
                    data.orderId,

                  razorpay_order_id:
                    paymentResponse
                      .razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse
                      .razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse
                      .razorpay_signature
                }
              );

            toast.success(
              "Payment successful!"
            );

            if (onSuccess) {
              onSuccess(
                verifyResponse.data
              );
            }

          } catch (error) {
            console.error(error);

            toast.error(
              error.response?.data
                ?.message ||
                "Payment verification failed"
            );
          }
        },

        modal: {
          ondismiss: () => {
            toast(
              "Payment cancelled"
            );
          }
        },

        theme: {
          color: "#6c63ff"
        }
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();

    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
        "Unable to start payment"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      color="primary"
      disabled={loading}
      onClick={handlePayment}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          {" "}Processing...
        </>
      ) : (
        <>
          Buy Now ₹{course.price}
        </>
      )}
    </Button>
  );
};

export default CoursePayment;