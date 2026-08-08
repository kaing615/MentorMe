function containsMongoOperator(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsMongoOperator);
  return Object.entries(value).some(
    ([key, nested]) =>
      key.startsWith("$") || key.includes(".") || containsMongoOperator(nested)
  );
}

export function rejectMongoOperators(request, response, next) {
  if (
    [request.body, request.query, request.params].some(containsMongoOperator)
  ) {
    return response.status(400).json({
      code: "INVALID_INPUT",
      message: "Input contains forbidden keys.",
    });
  }
  return next();
}

export default { rejectMongoOperators };
