type MockResponse = {
    statusCode: number;
    body: unknown;
    sentBody: unknown;
    status: (code: number) => MockResponse;
    json: (payload: unknown) => MockResponse;
    send: (payload?: unknown) => MockResponse;
};

export const createMockResponse = (): MockResponse => {
    const response: MockResponse = {
        statusCode: 200,
        body: undefined,
        sentBody: undefined,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        },
        send(payload?: unknown) {
            this.sentBody = payload;
            return this;
        }
    };

    return response;
};
