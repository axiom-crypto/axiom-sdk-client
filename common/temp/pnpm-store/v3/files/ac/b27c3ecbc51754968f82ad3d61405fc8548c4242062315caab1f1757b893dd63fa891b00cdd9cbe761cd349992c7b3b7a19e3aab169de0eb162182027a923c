import { HttpRequestError, TimeoutError, } from '../../errors/request.js';
import { withTimeout, } from '../promise/withTimeout.js';
import { stringify } from '../stringify.js';
import { idCache } from './id.js';
export function getHttpRpcClient(url, options = {}) {
    return {
        async request(params) {
            const { body, fetchOptions = {}, onRequest = options.onRequest, onResponse = options.onResponse, timeout = options.timeout ?? 10_000, } = params;
            const { headers, method, signal: signal_, } = { ...options.fetchOptions, ...fetchOptions };
            try {
                const response = await withTimeout(async ({ signal }) => {
                    const request = new Request(url, {
                        ...fetchOptions,
                        body: Array.isArray(body)
                            ? stringify(body.map((body) => ({
                                jsonrpc: '2.0',
                                id: body.id ?? idCache.take(),
                                ...body,
                            })))
                            : stringify({
                                jsonrpc: '2.0',
                                id: body.id ?? idCache.take(),
                                ...body,
                            }),
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                        },
                        method: method || 'POST',
                        signal: signal_ || (timeout > 0 ? signal : null),
                    });
                    if (onRequest)
                        await onRequest(request);
                    const response = await fetch(request);
                    return response;
                }, {
                    errorInstance: new TimeoutError({ body, url }),
                    timeout,
                    signal: true,
                });
                if (onResponse)
                    await onResponse(response);
                let data;
                if (response.headers.get('Content-Type')?.startsWith('application/json'))
                    data = await response.json();
                else
                    data = await response.text();
                if (!response.ok) {
                    throw new HttpRequestError({
                        body,
                        details: stringify(data.error) || response.statusText,
                        headers: response.headers,
                        status: response.status,
                        url,
                    });
                }
                return data;
            }
            catch (err) {
                if (err instanceof HttpRequestError)
                    throw err;
                if (err instanceof TimeoutError)
                    throw err;
                throw new HttpRequestError({
                    body,
                    details: err.message,
                    url,
                });
            }
        },
    };
}
//# sourceMappingURL=http.js.map