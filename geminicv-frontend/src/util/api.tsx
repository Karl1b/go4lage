import { Run, RunInfo, ToastDetails, UserDetails } from "./types";

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

      const responseJson = await response.json();

      if (responseJson.error) {
        setToast({
          show: true,
          success: false,
          header: responseJson.detail || "Error uploading login",
          text: responseJson.error,
        });
        return null;
      }

      setToast({
        show: true,
        success: true,
        header: "Login",
        text: "Login successful!",
      });
      return responseJson;
    } catch (e) {
      setToast({
        show: true,
        success: false,
        header: "Error uploading CV",
        text: "",
      });

      return null;
    }
  }

  public async uploadcv(
    token: string,
    formData: FormData,
    region: string,
    permanent: boolean,
    setToast: (toast: ToastDetails) => void
  ): Promise<RunInfo | null> {
    try {
      formData.append("language", region);
      const permentry = permanent ? "true" : "false";
      formData.append("permanent", permentry);

      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/uploadcv`,
        {
          method: "POST",
          body: formData,
        },
        token
      );
      const responseJson = await response.json();
      if (responseJson.error) {
        setToast({
          show: true,
          success: false,
          header: responseJson.detail || "Error uploading CV",
          text: responseJson.error,
        });
        return null;
      }
      setToast({
        show: true,
        success: true,
        header: "Upload CV",
        text: "CV uploaded successfully!",
      });
      return responseJson;
    } catch (e) {
      setToast({
        show: true,
        success: false,
        header: "Error uploading CV",
        text: "",
      });
      console.log(e);
      return null;
    }
  }

  public async getRuns(token: string | null): Promise<RunInfo | null> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/allruns`,
        {
          method: "GET",
        },
        token
      );
      const data = await response.json();
      if (data.error) {
        console.log(data.error);
      }

      return data;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async getRun(
    token: string | null,
    cvrunid: string
  ): Promise<Run | null> {
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
      if (data.error) {
        console.log(data.error);
      }
      return data;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  public async uploadText(
    token: string | null,
    text: string,
    region: string,
    permanent: boolean,
    setToast: (toast: ToastDetails) => void
  ): Promise<RunInfo | null> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geminicv/uploadtext`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            language: region,
            permanent: permanent,
          }),
        },
        token
      );
      const responseJson = await response.json();
      if (responseJson.error) {
        setToast({
          show: true,
          success: false,
          header: responseJson.detail || "Error uploading Text",
          text: responseJson.error,
        });
        return null;
      }
      setToast({
        show: true,
        success: true,
        header: "Text upload",
        text: "Text uploaded successfully!",
      });
      return responseJson;
    } catch (e) {
      setToast({
        show: true,
        success: false,
        header: "Error uploading Text",
        text: "",
      });
      console.log(e);
    }
    return null;
  }
}

const api = new API();
export default api;
