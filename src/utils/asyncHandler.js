// this is one way to write a wrapped function of async handler with promise
const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
// this is another way to write a wrapped function of async handler with
// try catch using async await

// const asyncHandler = () => {};
// const asyncHandler = () => {
//   () => {};
// };
// const asyncHandler = () => {
//   async () => {};
// };
// const asyncHandler = (requestHandler) => {
//   async (req, res, next) => {
//     try {
//       await requestHandler(req, res, next);
//     } catch (error) {
//       res.status(error.code || 500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   };
// };
