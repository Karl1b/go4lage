import { RunInfo, Scan, ToastDetails, UserDetails } from "./types";

class API {
  apiUrl: string;
  constructor() {
    const apiUrlstring = "{%Apiurl%}";

    const trimmedString = apiUrlstring.slice(2, -2).trim();

    if (trimmedString === "Apiurl") {
      this.apiUrl = "http://127.0.0.1:8080";
    } else {
      this.apiUrl = apiUrlstring;
    }
  }

  private async fetchWithToken(
    url: string,
    options: RequestInit,
    token: string | null
  ) {
    if (!token) throw new Error("Token is required");

    const headers = new Headers(options.headers);
    headers.append("Authorization", "Token " + token);

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  public async login(
    email: string,
    password: string,
    setToast: (toast: ToastDetails) => void
  ): Promise<UserDetails | null> {
    try {
      const response = await fetch(this.apiUrl + "/adminapi/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data: UserDetails = await response.json();
      setToast({
        show: true,
        success: true,
        header: "Login",
        text: "Login successful!",
      });
      return data;
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: "Login",
          text: `Login failed: ${error.message}`,
        });
      }

      return null;
    }
  }

  public async uploadcv(
    token: string,
    formData: FormData,
    setToast: (toast: ToastDetails) => void
  ): Promise<RunInfo> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/uploadcv`, //TODO: CHeck
        {
          method: "POST",
          body: formData,
        },
        token
      );

      const data = await response.json();
      return data;

      setToast({
        show: true,
        success: true,
        header: "CV upload",
        text: "CV upload complete",
      });
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: "CV upload",
          text: `Error uploading users: ${error.message}`,
        });

        console.error("Error creating users:", error.message);
      }
      throw error;
    }
  }

  public async getRuns(token: string | null): Promise<RunInfo> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/allruns`,
        {
          method: "GET",
        },
        token
      );
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching runs:", error.message);
      }
      throw error;
    }
  }

  public async getRun(token: string | null, cvrunid: string): Promise<Scan[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/run`,
        {
          method: "GET",
          headers: { CVrunID: cvrunid },
        },
        token
      );
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching runs:", error.message);
      }
      throw error;
    }
  }

  public async uploadText(token: string | null, text: string ,setToast: (toast: ToastDetails) => void): Promise<RunInfo> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/uploadtext`,
        {
          method: "POST",
          body: JSON.stringify({
            text: text,
          }),
        },
        token
      );
      
      const data = await response.json();
      return data;

      setToast({
        show: true,
        success: true,
        header: "Text send successfully",
        text: "CV send successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: "Text send fail",
          text: `Text send failed: ${error.message}`,
        });

        console.error("Error creating users:", error.message);
      }
      throw error;
    }
  }
}

const api = new API();
export default api;

