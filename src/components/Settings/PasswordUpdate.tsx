import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

function PasswordUpdate() {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const domain = import.meta.env.VITE_AUTH0_DOMAIN; // e.g., dev-xxxx.auth0.com
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID; // Found in your Auth0 application settings
  const connection = "Username-Password-Authentication"; // Your DB connection name
  const [email, setEmail] = useState("");
  const [canResetPassword, setCanResetPassword] = useState(false);

  useEffect(() => {
    // Get the user's email from the Auth0 user object
    if (isAuthenticated && user) {
      setEmail(user.email || "");
      const isDatabaseUser = user.sub?.includes("auth0") || false;
      setCanResetPassword(isDatabaseUser);
    }
  }, [isAuthenticated, user]);

  const handleResetPassword = async () => {
    if (!email) {
      alert("Email is required!");
      return;
    }

    try {
      const response = await fetch(`https://${domain}/dbconnections/change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          email: email,
          connection: connection
        })
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get the response as text
        throw new Error(errorText); // Throw an error with the response text
      }

      const resultText = await response.text(); // Get the response as text
      alert(resultText || "If an account exists, a password reset email has been sent!");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      alert("There was an error sending the reset email. Please try again.");
    }
  };

 return (
    <div>
      {isAuthenticated ? (
        canResetPassword ? (
          <button onClick={handleResetPassword} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            Forgot Password?
          </button>
        ) : (
          <p>
            You cannot reset your password through this application because you signed in with a social account. Please use the social provider's password recovery options.
          </p>
        )
      ) : (
        <p>Please log in to manage your password.</p>
      )}
    </div>
  );
}

export default PasswordUpdate;