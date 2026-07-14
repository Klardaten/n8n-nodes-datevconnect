/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { DocumentFileResourceHandler } from "../../../../nodes/DocumentManagement/handlers/DocumentFileResourceHandler";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";

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

    spyOn(DocumentManagementClient, "fetchDocumentFile").mockResolvedValue(
      new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), {
        headers: { "content-type": "application/pdf" },
      }),
    );
  });

  test("downloads a document file whose ID is a number", async () => {
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
});
