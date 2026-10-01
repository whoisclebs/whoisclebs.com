/**
 * Trechos de código copiados literalmente das revisões citadas nos cases (tabs preservados).
 * Conferir contra o GitHub: `node scripts/verify-case-snippets.mjs` (usa a rede; fora do build).
 */

/** tuxedo/request.go linhas 17–35 */
export const tuxedoRequest = "func (c *Client) R() *Request {\n\treturn &Request{\n\t\tclient:  c,\n\t\theaders: make(map[string]string),\n\t}\n}\n\n// AddHeader sets a custom header for the request.\n//\n// Parameters:\n//   - key: The header name.\n//   - value: The header value.\n//\n// Returns:\n//   - *Request: The request instance to allow method chaining.\nfunc (r *Request) AddHeader(key, value string) *Request {\n\tr.headers[key] = value\n\treturn r\n}"

/** tuxedo/client.go linhas 41–71 */
export const tuxedoExecute = "func (r *Request) execute(method, url string) (*Response, error) {\n\treq, err := http.NewRequest(method, url, bytes.NewBuffer(r.body))\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tfor key, value := range r.headers {\n\t\treq.Header.Set(key, value)\n\t}\n\tif r.body != nil && req.Header.Get(\"Content-Type\") == \"\" {\n\t\treq.Header.Set(\"Content-Type\", \"application/json\")\n\t}\n\tif r.enableTrace {\n\t\t// TODO: Add trace logs\n\t}\n\tresp, err := r.client.httpClient.Do(req)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\tdefer doClose(resp.Body)\n\n\trespBody, err := io.ReadAll(resp.Body)\n\tif err != nil {\n\t\treturn nil, err\n\t}\n\n\treturn &Response{\n\t\tStatusCode: resp.StatusCode,\n\t\tBody:       respBody,\n\t\tHeaders:    resp.Header,\n\t}, nil\n}"

/** tuxedo/utils.go linhas 8–12 */
export const tuxedoDoClose = "func doClose(c io.Closer) {\n\tif err := c.Close(); err != nil {\n\t\tlog.Fatal(err)\n\t}\n}"

/** golpher/golpher.go linhas 128–143 */
export const golpherFreeze = "// ServeHTTP implements http.Handler. The first call freezes the route\n// table; subsequent route/middleware registrations panic.\nfunc (app *App) ServeHTTP(w http.ResponseWriter, req *http.Request) {\n\tapp.freezeOnce()\n\tapp.router.ServeHTTP(w, req)\n}\n\n// freezeOnce atomically freezes the app if not already frozen.\nfunc (app *App) freezeOnce() {\n\tif app.frozen.Load() {\n\t\treturn\n\t}\n\tapp.lifecycleMu.Lock()\n\tapp.frozen.Swap(true)\n\tapp.lifecycleMu.Unlock()\n}"

/** golpher/error.go linhas 52–61 */
export const golpherReportError = "// reportError fires the observer and, if the response is not yet\n// committed, delegates to the error handler.\nfunc (app *App) reportError(req *Request, res *Response, err error) {\n\tif app.errorObserver != nil {\n\t\tapp.errorObserver(req, res, err)\n\t}\n\tif !res.Committed() {\n\t\tapp.errorHandler(req, res, err)\n\t}\n}"

/** golpher/router.go linhas 214–246 */
export const golpherRouter = "func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {\n\tresponse := acquireResponse(w, r.app.config.EnableBodyCapture)\n\tdefer releaseResponse(response)\n\n\tif byPath := r.staticRoutes[req.Method]; byPath != nil {\n\t\tif staticIdx, ok := byPath[req.URL.Path]; ok {\n\t\t\tr.dispatch(response, req, staticIdx)\n\t\t\treturn\n\t\t}\n\t}\n\n\ttrimmedPath := strings.Trim(req.URL.Path, \"/\")\n\trequest := acquireRequest(req, response, r.app.config.MaxRequestBodyBytes)\n\tdefer releaseRequest(request)\n\n\tif tree := r.dynamicRoutes[req.Method]; tree != nil {\n\t\tif routeIndex, ok := tree.match(trimmedPath, request); ok {\n\t\t\trequest.paramNames = r.routes[routeIndex].paramNames\n\t\t\tr.dispatchRequest(response, request, routeIndex)\n\t\t\treturn\n\t\t}\n\t}\n\n\tmethodMismatch := r.pathMatchesAnyMethod(req.Method, req.URL.Path, trimmedPath)\n\tif methodMismatch {\n\t\tresponse.Header().Set(\"Allow\", r.allowedMethods(req.Method, req.URL.Path, trimmedPath))\n\t\tr.app.reportError(request, response,\n\t\t\tErrorGolpher{Code: http.StatusMethodNotAllowed, Message: \"Method Not Allowed\"})\n\t\treturn\n\t}\n\n\tr.app.reportError(request, response,\n\t\tErrorGolpher{Code: http.StatusNotFound, Message: \"Not Found\"})"

/** golpher/request.go linhas 119–140 */
export const golpherLazyBody = "// body returns the underlying body, wrapped with http.MaxBytesReader\n// the first time a positive limit is configured. Wrapping is\n// idempotent: calling body() twice with the same limit wraps once.\n// A nil response is tolerated; in that case no wrapping occurs.\nfunc (r *Request) body() io.ReadCloser {\n\tif r.http.Body == nil {\n\t\treturn nil\n\t}\n\tlimit := r.effectiveBodyLimit()\n\tif limit < 0 {\n\t\treturn r.http.Body\n\t}\n\tif limit > 0 && !r.bodyWrapped {\n\t\tr.bodyWrapped = true\n\t\tvar w http.ResponseWriter\n\t\tif r.response != nil {\n\t\t\tw = r.response.Raw()\n\t\t}\n\t\tr.http.Body = http.MaxBytesReader(w, r.http.Body, limit)\n\t}\n\treturn r.http.Body\n}"
