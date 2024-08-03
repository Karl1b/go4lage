import { Run, RunInfo, ToastDetails, UserDetails } from "./types";

interface FetchWithTokenProps {
  url: string;
  options: RequestInit;
  token: string | null;
  toastHeader: string | null;
  setToast: ((toast: ToastDetails) => void | null) | null;
}

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

  private async fetchWithToken({
    url,
    options,
    token,
    toastHeader,
    setToast,
  }: FetchWithTokenProps) {
    if (!token && setToast) {
      setToast({
        show: true,
        success: false,
        header: "Token is missing",
        text: "Try login and out again",
      });
      return;
    }

    const headers = new Headers(options.headers);
    headers.append("Authorization", "Token " + token);

    const response = await fetch(url, { ...options, headers });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const responseJson = await response.json();
      if (responseJson.error && setToast) {
        setToast({
          show: true,
          success: false,
          header: toastHeader || "Toastheader missing",
          text: `${responseJson.detail} ${responseJson.error}`,
        });
        return;
      }
      if (responseJson.text && setToast) {
        setToast({
          show: true,
          success: true,
          header: toastHeader || "Toastheader missing",
          text: `${responseJson.text}`,
        });
        return;
      }

      if (!response.ok) {
        if (setToast) {
          setToast({
            show: true,
            success: false,
            header: "Error outside go4lage",
            text: `${response.status}`,
          });
        }
        return;
      }
      return responseJson;
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
        header: "Error outside go4lage",
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
    formData.append("language", region);
    const permentry = permanent ? "true" : "false";
    formData.append("permanent", permentry);

    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/geminicv/uploadcv`,
      options: {
        method: "POST",
        body: formData,
      },
      token: token,
      toastHeader: "CV uploaded",
      setToast: setToast,
    });

    return response;
  }

  public async getRuns(token: string | null): Promise<RunInfo | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/geminicv/allruns`,
      options: {
        method: "GET",
      },
      token: token,
      toastHeader: "",
      setToast: null,
    });

    return response;
  }

  public async getRun(
    token: string | null,
    cvrunid: string
  ): Promise<Run | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/geminicv/run`,
      options: {
        method: "GET",
        headers: { Id: cvrunid },
      },
      token: token,
      toastHeader: "",
      setToast: null,
    });

    return response;
  }

  public async uploadText(
    token: string | null,
    text: string,
    region: string,
    permanent: boolean,
    setToast: (toast: ToastDetails) => void
  ): Promise<RunInfo | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/geminicv/run`,
      options: {
        method: "POST",

        body: JSON.stringify({
          text: text,
          language: region,
          permanent: permanent,
        }),
      },

      token: token,
      toastHeader: "Error Uploading text",
      setToast: setToast,
    });

    return response;
  }
}

const api = new API();
export default api;
