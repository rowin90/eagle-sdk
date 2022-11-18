export default {
    onload:(cb)=>{
        if(document.readyState === 'interactive'){
            cb()
            return void 0
        }

        window.addEventListener('load',()=>{
            cb()
        })
    },
    filterTime:(a,b) => Math.abs(a-b)
}
