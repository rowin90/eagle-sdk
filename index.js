import perf from "./perf";
import resource from "./resource";
import errorResponse from "./errorResponse";

perf.init(perfData => {
    console.log("-> perfData", perfData);
})

resource.init((resourceData)=>{
    console.log("-> resourceData", resourceData);
})

errorResponse.init(error => {
    console.log("-> error", error);
})
