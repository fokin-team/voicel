interface BodyGeneric<T = unknown> {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<T>;
  text(): Promise<string>;
}

type ResponseGeneric<T = unknown> = BodyGeneric<T>;

const request = async <T = unknown>(
  url: string,
  params: RequestInit,
  requestHeaders: Headers,
): Promise<ResponseGeneric<T>> => {
  try {
    const tokenAccess = localStorage.getItem('tokenAccess') as string;

    if (tokenAccess) {
      requestHeaders.set('Authorization', `Bearer ${tokenAccess}`);
    }

    params.headers = requestHeaders;

    const response = (await fetch(url, params)) as ResponseGeneric<T>;
    return response;
  } catch (error) {
    console.warn(`Не удалось получить доступ API: ${url}`);
    throw error;
  }
};

type UrlParamsType = Record<string, string | number | boolean>;
type RequestHeaders = Record<string, string>;

const useFetch = {
  get: async <T = unknown>(
    url: string,
    params: UrlParamsType = {},
    headers: RequestHeaders = {},
  ): Promise<ResponseGeneric<T>> => {
    let urlWithParams = url;
    const requestHeaders: HeadersInit = new Headers();
    if (Object.keys(headers).length !== 0) {
      Object.entries(headers).forEach(([key, value]) => {
        if (value && typeof value !== 'undefined') {
          requestHeaders.set(key, value);
        }
      });
    }

    const paramsValue: RequestInit = { headers: new Headers() };
    const paramsWithNotEmpty: Record<string, string> = {};

    if (Object.keys(params).length !== 0) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && typeof value !== 'undefined') {
          paramsWithNotEmpty[key] = value.toString();
        }
      });

      urlWithParams = `${url}?${new URLSearchParams(paramsWithNotEmpty).toString()}`;
    }

    const response = await request<T>(urlWithParams, paramsValue, requestHeaders);
    return response;
  },

  post: async <T = unknown>(url: string, body = {}, params: UrlParamsType = {}): Promise<ResponseGeneric<T>> => {
    let urlWithParams = url;
    const requestHeaders: HeadersInit = new Headers();

    const paramsValue: RequestInit = {
      method: 'POST',
    };

    if (body instanceof FormData) {
      paramsValue.body = body;
    } else {
      requestHeaders.set('Content-Type', 'application/json');
      paramsValue.body = JSON.stringify(body);
    }

    const paramsWithNotEmpty: Record<string, string> = {};
    if (Object.keys(params).length !== 0) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && typeof value !== 'undefined') {
          paramsWithNotEmpty[key] = value.toString();
        }
      });
      urlWithParams = `${url}?${new URLSearchParams(paramsWithNotEmpty).toString()}`;
    }

    const response = await request<T>(urlWithParams, paramsValue, requestHeaders);
    return response;
  },
};

export {
  useFetch,
};
