
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    } 
}

export {asyncHandler}

// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//             .then(result => {
//                 // If `requestHandler` resolves to a value, send that value as a response if needed.
//                 if (result !== undefined) {
//                     res.json(result);
//                 }
//             })
//             .catch(next); // Pass errors to the next middleware (typically an error handler)
//     }
// }  This above code is giving error that is below
    // TypeError: Converting circular structure to JSON
    // --> starting at object with constructor 'Socket'
    // |     property 'parser' -> object with constructor 'HTTPParser'
    // --- property 'socket' closes the circle
    // at JSON.stringify (<anonymous>)
    // at stringify (C:\backend\node_modules\express\lib\response.js:1159:12)
    // at ServerResponse.json (C:\backend\node_modules\express\lib\response.js:272:14)
    // at file:///C:/backend/src/utils/asyncHandler.js:9:25
    // at process.processTicksAndRejections (node:internal/process/task_queues:95:5)



/***********  2nd Method   *********** */
// const asyncHandler =  (requestHandler) => {
//    return async (req, res, next) => {
//         try {
//             await requestHandler(req, res, next)
//         } catch(error) {
//             res.status(error.code || 500).json({
//                 success:false,
//                 message : error.messgae
//             })
//         }
//     }
// }
   
