export default (req, res, next) => {
    if (req.body.skills && typeof req.body.skills === "string") {
        req.body.skills = req.body.skills.split(",").map(s => s.trim());
    }
    next();
}
