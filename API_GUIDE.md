
# API Documentation and Usage Guide

This guide details the new API endpoints created for managing Box Types, Boxes, and Box Requests.

## 1. BoxType API
Managed by `BoxTypeController`. Supports creating box definitions including their pieces and images.

### Create BoxType
**Endpoint:** `POST /api/boxtype`
**Content-Type:** `multipart/form-data`
**Description:** Creates a new BoxType with defined pieces and optional images.

**Parameters:**
- `code` (string): Unique code for the box type.
- `description` (string): Description of the box type.
- `pieces` (JSON string): A stringified JSON array of piece objects. 
  - Structure: `[ { "id": "ref1", "description": "Piece 1" }, ... ]`.
  - The `id` here is your reference ID.
- `piece_INDEX` (File): Upload files matching the index of the piece in the `pieces` array.
  - Example: To upload an image for the **first** piece (index 0), use a form-data field named `piece_0`.

### Update BoxType
**Endpoint:** `PUT /api/boxtype/:id`
**Content-Type:** `multipart/form-data`
**Description:** Updates an existing BoxType and its pieces.

**Parameters:**
- `code` (optional)
- `description` (optional)
- `pieces` (JSON string, optional): List of pieces to update/add.
  - If a piece object has an `id` (database ID), it updates that piece.
  - If no `id`, it creates a new piece.
- `piece_INDEX` (File): Upload files to update images.

### Get All BoxTypes
**Endpoint:** `GET /api/boxtype`

### Get BoxType by ID
**Endpoint:** `GET /api/boxtype/:id`

### Get BoxType by Code
**Endpoint:** `GET /api/boxtype/code/:code`

### Delete BoxType
**Endpoint:** `DELETE /api/boxtype/:id`

---

## 2. Box API
Managed by `BoxController`. Represents physical inventory.

### Create Box (Add to Stock)
**Endpoint:** `POST /api/box`
**Content-Type:** `application/json`
**Description:** Adds a new physical box. Automatically adds the count of pieces to the BoxType stock (`totalCount`).

**Body:**
```json
{
  "boxtypeCode": "BOX001",
  "matricule": "USER123",
  "pieces": [
    { "idPiece": "ref1", "count": 10 },
    { "idPiece": "ref2", "count": 5 }
  ]
}
```
*Note: `idPiece` must match the `refId` of the pieces in the BoxType definition.*

---

## 3. Box Request API
Managed by `BoxRequestController`. Handles demands and reservations.

### Create Request
**Endpoint:** `POST /api/boxrequest`
**Content-Type:** `application/json`
**Description:** Creates a demand. Increases `demandNumber` for the BoxType pieces (Reservation).

**Body:**
```json
{
  "boxtypeCode": "BOX001",
  "matricule": "USER123",
  "demandNumber": 2
}
```

### Validate Request
**Endpoint:** `PUT /api/boxrequest/:id/validate`
**Description:** Validates a request. Decreases both `totalCount` (Stock) and `demandNumber` (Reservation) for the associated pieces.

### Get All Requests
**Endpoint:** `GET /api/boxrequest`
