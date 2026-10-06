export function createCrudController(Model, options = {}) {
  const { populate = [], sort = { createdAt: -1 } } = options;

  const applyPopulate = (query) => {
    let next = query;
    populate.forEach((item) => {
      next = next.populate(item);
    });
    return next;
  };

  return {
    list: async (req, res, next) => {
      try {
        const records = await applyPopulate(Model.find().sort(sort));
        res.json(records);
      } catch (error) {
        next(error);
      }
    },

    get: async (req, res, next) => {
      try {
        const record = await applyPopulate(Model.findById(req.params.id));
        if (!record) return res.status(404).json({ message: "Record not found" });
        res.json(record);
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const record = await Model.create(req.body);
        const populated = await applyPopulate(Model.findById(record._id));
        res.status(201).json(populated);
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const record = await Model.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Record not found" });
        Object.assign(record, req.body);
        await record.save();
        const populated = await applyPopulate(Model.findById(record._id));
        res.json(populated);
      } catch (error) {
        next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        const record = await Model.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ message: "Record not found" });
        res.json({ message: "Record deleted" });
      } catch (error) {
        next(error);
      }
    },
  };
}

