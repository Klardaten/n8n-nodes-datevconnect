/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { NodeApiError } from "n8n-workflow";
import { DocumentFileResourceHandler } from "../../../../nodes/DocumentManagement/handlers/DocumentFileResourceHandler";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { HttpRequestHelper } from "../../../../src/services/httpHelpers";

let documentFileResourceHandler: DocumentFileResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id",
};

describe("DocumentFileResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock((name: string) =>
        name === "documentFileId" ? 44167 : undefined,
      ),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    documentFileResourceHandler = new DocumentFileResourceHandler(
      mockContext,
      0,
    );
  });

  afterEach(() => {
    spyOn(DocumentManagementClient, "fetchDocumentFile").mockRestore();
  });

  test("downloads a document file whose ID is a number", async () => {
    spyOn(DocumentManagementClient, "fetchDocumentFile").mockResolvedValue(
      new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        headers: { "content-type": "application/pdf" },
      }),
    );
    const returnData: any[] = [];

    await documentFileResourceHandler.execute(
      "get",
      mockAuthContext,
      returnData,
    );

    expect(DocumentManagementClient.fetchDocumentFile).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      fileId: "44167",
    });
    expect(returnData).toEqual([
      {
        json: {
          success: true,
          id: "44167",
          contentType: "application/pdf",
          size: 4,
        },
        binary: {
          data: {
            data: "JVBERg==",
            mimeType: "application/pdf",
            fileName: "44167",
            fileSize: "4",
          },
        },
      },
    ]);
  });

  test("preserves file bytes through the HTTP adapter, client, and binary output", async () => {
    const original = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
    const httpHelper: HttpRequestHelper = mock(async (options) => ({
      body:
        options.encoding === "arraybuffer"
          ? original
          : original.toString("utf8"),
      statusCode: 200,
      headers: { "content-type": "application/pdf" },
    }));
    const returnData: any[] = [];

    await documentFileResourceHandler.execute(
      "get",
      { ...mockAuthContext, httpHelper },
      returnData,
    );

    expect(httpHelper).toHaveBeenCalledTimes(1);
    expect(httpHelper).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "localhost/datevconnect/dms/v2/document-files/44167",
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          Accept: "application/octet-stream",
        },
      }),
    );
    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      success: true,
      id: "44167",
      contentType: "application/pdf",
      size: original.byteLength,
    });
    expect(returnData[0].binary.data).toEqual({
      data: original.toString("base64"),
      mimeType: "application/pdf",
      fileName: "44167",
      fileSize: original.byteLength.toString(),
    });
    expect(Buffer.from(returnData[0].binary.data.data, "base64")).toEqual(
      original,
    );
  });

  test("preserves API error response context when continueOnFail is false", async () => {
    const apiError = new NodeApiError(mockContext.getNode(), {
      message: "DATEV document file request failed",
      statusCode: 404,
      response: {
        data: {
          detail: "The document file does not exist",
        },
      },
    });
    spyOn(DocumentManagementClient, "fetchDocumentFile").mockRejectedValueOnce(
      apiError,
    );

    const execution = documentFileResourceHandler.execute(
      "get",
      mockAuthContext,
      [],
    );

    await expect(execution).rejects.toBe(apiError);
    expect(apiError.httpCode).toBe("404");
    expect(apiError.context.data).toEqual({
      detail: "The document file does not exist",
    });
  });
});
