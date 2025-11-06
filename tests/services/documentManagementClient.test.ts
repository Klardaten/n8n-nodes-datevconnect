/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn } from "bun:test";
import { DocumentManagementClient } from "../../src/services/documentManagementClient";

describe('DocumentManagementClient - All Endpoints', () => {
  const mockFetch = spyOn(global, "fetch");

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test("1. GET /documents - fetchDocuments", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "doc-123", description: "Test document" }]
    } as Response);

    const result = await DocumentManagementClient.fetchDocuments({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      filter: "number eq 12345",
      top: 10,
      skip: 0,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents?filter=number+eq+12345&top=10",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([{ id: "doc-123", description: "Test document" }]);
  });

  test("2. POST /documents - createDocument", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: {
        get: (name: string) => name === "Location" ? "/documents/new-doc-123" : null
      },
      json: async () => ({ success: true })
    } as any);

    const documentData = {
      description: "New test document",
      domain: { id: 1 },
      state: { id: "active" },
    };

    const result = await DocumentManagementClient.createDocument({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      document: documentData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Content-Type": "application/json;charset=utf-8",
          "Accept": "application/json;charset=utf-8",
        },
        body: JSON.stringify(documentData),
      }
    );

    expect(result).toEqual({ success: true, location: "/documents/new-doc-123" });
  });

  test("3. GET /document-files/{file-id} - fetchDocumentFile", async () => {
    const mockResponse = {
      ok: true,
      headers: {
        get: (name: string) => name === "content-type" ? "application/pdf" : null
      },
      arrayBuffer: async () => new ArrayBuffer(1024)
    } as any;

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await DocumentManagementClient.fetchDocumentFile({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      fileId: "file-123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/document-files/file-123",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/octet-stream",
        },
      }
    );

    expect(result).toBe(mockResponse);
  });

  test("4. POST /document-files - uploadDocumentFile", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "uploaded-file-123", success: true })
    } as Response);

    const binaryData = "test binary data";

    const result = await DocumentManagementClient.uploadDocumentFile({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      binaryData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/document-files",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Content-Type": "application/octet-stream",
          "Accept": "application/json;charset=utf-8",
        },
        body: binaryData,
      }
    );

    expect(result).toEqual({ id: "uploaded-file-123", success: true });
  });

  test("17. GET /documents/{id} - fetchDocument", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "doc-123", description: "Test document", domain: { id: 1 } })
    } as Response);

    const result = await DocumentManagementClient.fetchDocument({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual({ id: "doc-123", description: "Test document", domain: { id: 1 } });
  });

  test("18. PUT /documents/{id} - updateDocument", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    const documentData = {
      description: "Updated document",
      domain: { id: 2 },
    };

    const result = await DocumentManagementClient.updateDocument({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
      document: documentData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123",
      {
        method: "PUT",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Content-Type": "application/json;charset=utf-8",
          "Accept": "application/json;charset=utf-8",
        },
        body: JSON.stringify(documentData),
      }
    );

    expect(result).toEqual({ success: true, documentId: "doc-123" });
  });

  test("19. GET /documents/{id}/structure-items - fetchStructureItems", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "item-123", name: "document.pdf", type: 1, counter: 1 },
        { id: "item-456", name: "attachment.docx", type: 2, counter: 2 }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchStructureItems({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
      top: 10,
      skip: 0,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123/structure-items?top=10",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: "item-123", name: "document.pdf", type: 1, counter: 1 },
      { id: "item-456", name: "attachment.docx", type: 2, counter: 2 }
    ]);
  });

  test("20. GET /documents/{id}/structure-items/{itemId} - fetchStructureItem", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "item-123", name: "document.pdf", type: 1, counter: 1 })
    } as Response);

    const result = await DocumentManagementClient.fetchStructureItem({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
      structureItemId: "item-123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123/structure-items/item-123",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual({ id: "item-123", name: "document.pdf", type: 1, counter: 1 });
  });

  test("21. POST /documents/{id}/structure-items - addStructureItem", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: {
        get: (name: string) => name === "Location" ? "/documents/doc-123/structure-items/new-item-456" : null
      },
    } as any);

    const structureItemData = {
      name: "new-attachment.pdf",
      type: 1,
    };

    const result = await DocumentManagementClient.addStructureItem({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
      structureItem: structureItemData,
      insertPosition: "last",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123/structure-items?insertPosition=last",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Content-Type": "application/json;charset=utf-8",
          "Accept": "application/json;charset=utf-8",
        },
        body: JSON.stringify(structureItemData),
      }
    );

    expect(result).toEqual({ success: true, location: "/documents/doc-123/structure-items/new-item-456" });
  });

  test("22. PUT /documents/{id}/structure-items/{itemId} - updateStructureItem", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    const structureItemData = {
      name: "updated-document.pdf",
      type: 1,
    };

    const result = await DocumentManagementClient.updateStructureItem({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
      structureItemId: "item-123",
      structureItem: structureItemData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123/structure-items/item-123",
      {
        method: "PUT",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Content-Type": "application/json;charset=utf-8",
          "Accept": "application/json;charset=utf-8",
        },
        body: JSON.stringify(structureItemData),
      }
    );

    expect(result).toEqual({ success: true, documentId: "doc-123", structureItemId: "item-123" });
  });

  test("23. POST /documents/{id}/dispatcher-information - createDispatcherInformation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: {
        get: (name: string) => name === "Location" ? "/documents/doc-123/dispatcher-information/new-info-789" : null
      },
    } as any);

    const dispatcherData = {
      recipient: "John Doe",
      dispatch_date: "2023-12-01",
      method: "email",
    };

    const result = await DocumentManagementClient.createDispatcherInformation({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
      dispatcherInformation: dispatcherData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123/dispatcher-information",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Content-Type": "application/json;charset=utf-8",
          "Accept": "application/json;charset=utf-8",
        },
        body: JSON.stringify(dispatcherData),
      }
    );

    expect(result).toEqual({ success: true, location: "/documents/doc-123/dispatcher-information/new-info-789" });
  });

  test("5. GET /domains - fetchDomains", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Client Documents", is_selected: true },
        { id: 4, name: "Correspondence", is_selected: false }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchDomains({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      filter: "id eq 1",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/domains?filter=id+eq+1",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: 1, name: "Client Documents", is_selected: true },
      { id: 4, name: "Correspondence", is_selected: false }
    ]);
  });

  test("6. GET /documentstates - fetchDocumentStates", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: "active", name: "Active", valid_document_classes: [1, 3] },
        { id: "archived", name: "Archived", valid_document_classes: [1, 3] }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchDocumentStates({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documentstates",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: "active", name: "Active", valid_document_classes: [1, 3] },
      { id: "archived", name: "Archived", valid_document_classes: [1, 3] }
    ]);
  });

  test("7. GET /info - fetchInfo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        environment: "DATEV DMS",
        version: { name: "2.3.1", number: "2.3.1" },
        application: "DATEV Document Management"
      })
    } as Response);

    const result = await DocumentManagementClient.fetchInfo({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/info",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual({
      environment: "DATEV DMS",
      version: { name: "2.3.1", number: "2.3.1" },
      application: "DATEV Document Management"
    });
  });

  test("8. DELETE /documents/{id} - deleteDocument", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await DocumentManagementClient.deleteDocument({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123",
      {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
        },
      }
    );
  });

  test("9. DELETE /documents/{id}/delete-permanently - deleteDocumentPermanently", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await DocumentManagementClient.deleteDocumentPermanently({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      documentId: "doc-123",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/documents/doc-123/delete-permanently",
      {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
        },
      }
    );
  });

  test("10. GET /secure-areas - fetchSecureAreas", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Confidential", description: "Confidential documents" },
        { id: 2, name: "Public", description: "Public documents" }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchSecureAreas({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/secure-areas",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: 1, name: "Confidential", description: "Confidential documents" },
      { id: 2, name: "Public", description: "Public documents" }
    ]);
  });

  test("11. GET /property-templates - fetchPropertyTemplates", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Invoice Template", document_class: 1 },
        { id: 2, name: "Contract Template", document_class: 2 }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchPropertyTemplates({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      filter: "document_class eq 1",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/property-templates?filter=document_class+eq+1",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: 1, name: "Invoice Template", document_class: 1 },
      { id: 2, name: "Contract Template", document_class: 2 }
    ]);
  });

  test("12. GET /individual-properties - fetchIndividualProperties", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Custom Property 1", data_type: "string" },
        { id: 2, name: "Custom Property 2", data_type: "number" }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchIndividualProperties({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/individual-properties",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: 1, name: "Custom Property 1", data_type: "string" },
      { id: 2, name: "Custom Property 2", data_type: "number" }
    ]);
  });

  test("13. GET /individual-references1 - fetchIndividualReferences1", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Reference 1", correspondence_partner_guid: null },
        { id: 2, name: "Reference 2", correspondence_partner_guid: "guid-123" }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchIndividualReferences1({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      top: 10,
      skip: 0,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/individual-references1?top=10",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: 1, name: "Reference 1", correspondence_partner_guid: null },
      { id: 2, name: "Reference 2", correspondence_partner_guid: "guid-123" }
    ]);
  });

  test("14. POST /individual-references1 - createIndividualReference1", async () => {
    const newIndividualReference = {
      name: "New Reference 1",
      correspondence_partner_guid: "guid-456",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 3, name: "New Reference 1", correspondence_partner_guid: "guid-456" }
      ]
    } as Response);

    const result = await DocumentManagementClient.createIndividualReference1({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      individualReference: newIndividualReference,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/individual-references1",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(newIndividualReference),
      }
    );

    expect(result).toEqual([
      { id: 3, name: "New Reference 1", correspondence_partner_guid: "guid-456" }
    ]);
  });

  test("15. GET /individual-references2 - fetchIndividualReferences2", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "Reference 2-1", correspondence_partner_domain: "clients" },
        { id: 2, name: "Reference 2-2", correspondence_partner_domain: "employees" }
      ]
    } as Response);

    const result = await DocumentManagementClient.fetchIndividualReferences2({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      top: 5,
      skip: 2,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/individual-references2?top=5&skip=2",
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
        },
      }
    );

    expect(result).toEqual([
      { id: 1, name: "Reference 2-1", correspondence_partner_domain: "clients" },
      { id: 2, name: "Reference 2-2", correspondence_partner_domain: "employees" }
    ]);
  });

  test("16. POST /individual-references2 - createIndividualReference2", async () => {
    const newIndividualReference = {
      name: "New Reference 2",
      correspondence_partner_domain: "legal",
      correspondence_partner_guid: "guid-789",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { 
          id: 4, 
          name: "New Reference 2", 
          correspondence_partner_domain: "legal",
          correspondence_partner_guid: "guid-789"
        }
      ]
    } as Response);

    const result = await DocumentManagementClient.createIndividualReference2({
      host: "https://localhost:58452",
      token: "test-token",
      clientInstanceId: "test-client-id",
      individualReference: newIndividualReference,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://localhost:58452/datevconnect/dms/v2/individual-references2",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer test-token",
          "x-client-instance-id": "test-client-id",
          "Accept": "application/json;charset=utf-8",
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(newIndividualReference),
      }
    );

    expect(result).toEqual([
      { 
        id: 4, 
        name: "New Reference 2", 
        correspondence_partner_domain: "legal",
        correspondence_partner_guid: "guid-789"
      }
    ]);
  });
});