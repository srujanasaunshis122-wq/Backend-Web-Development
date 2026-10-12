/*
 * Repository Implementation & Contract
 *
 * This repository manages the in-memory persistence of post entities behind
 * a stable, decoupled boundary so the service layer never depends on storage details.
 *
 * Storage-Swap Proof:
 * As demonstrated below, this repository uses a Map-backed store rather than an array,
 * proving that consumers depend strictly on the repository contract, not the underlying
 * data structure.
 *
 * Future Migration to Prisma (What will change vs what will remain unchanged):
 *
 * What will change:
 * - Internal data store (the in-memory Map) will be replaced with Prisma client calls (e.g., prisma.post.findMany(), prisma.post.findUnique(), etc.).
 * - ID generation and auto-incrementing logic will be delegated to the database rather than tracked locally via nextId.
 * - Repository method signatures will become asynchronous (returning Promises), requiring services to await them.
 * - Direct memory manipulation/cloning will be replaced by database queries and transactions.
 *
 * What will remain unchanged:
 * - The repository interface contract (findAll, findById, create, update, remove) and semantic operations.
 * - Business logic, domain rules, and input validation located in the service layer.
 * - Service method semantics and return shapes (returning domain records or null / boolean).
 * - Controllers and routes: HTTP status codes, error handling, and response JSON formats remain completely untouched.
 */

const postStore = require('../data/postStore');

// Initialize internal storage using a Map-backed store (storage-swap proof)
const posts = new Map(
  (postStore.posts || []).map((post) => [post.id, { ...post }])
);

let nextId = Math.max(...posts.keys(), 0) + 1;

/**
 * Returns a new array of all posts.
 * @returns {Array<Object>}
 */
function findAll() {
  return Array.from(posts.values()).map((post) => ({ ...post }));
}

/**
 * Finds a post by its ID.
 * @param {number|string} id
 * @returns {Object|null}
 */
function findById(id) {
  const numericId = Number(id);
  const post = posts.get(numericId);
  return post ? { ...post } : null;
}

/**
 * Creates a new post with a generated id.
 * @param {Object} fields
 * @returns {Object} Complete created record including generated id
 */
function create(fields) {
  const record = {
    id: nextId++,
    title: fields.title,
    body: fields.body !== undefined ? fields.body : '',
    authorId: fields.authorId,
  };
  posts.set(record.id, record);
  return { ...record };
}

/**
 * Updates a post by ID with the given patch.
 * @param {number|string} id
 * @param {Object} patch
 * @returns {Object|null} Updated record or null if not found
 */
function update(id, patch) {
  const numericId = Number(id);
  const post = posts.get(numericId);
  if (!post) {
    return null;
  }
  if (patch.title !== undefined) post.title = patch.title;
  if (patch.body !== undefined) post.body = patch.body;
  if (patch.authorId !== undefined) post.authorId = patch.authorId;

  return { ...post };
}

/**
 * Removes a post by ID.
 * @param {number|string} id
 * @returns {boolean} true if removed, false if not found
 */
function remove(id) {
  const numericId = Number(id);
  if (!posts.has(numericId)) {
    return false;
  }
  posts.delete(numericId);
  return true;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
