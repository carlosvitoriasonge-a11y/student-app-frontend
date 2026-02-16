export async function onRequest(context) {
    const backendURL = "http://192.168.1.58:8000/api/google/callback";
  
    const response = await fetch(backendURL, {
      method: context.request.method,
      headers: context.request.headers,
      body: context.request.body
    });
  
    return new Response(response.body, response);
  }
  