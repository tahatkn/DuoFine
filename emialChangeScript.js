const params = new URLSearchParams(window.location.search)
const uid = params.get('uid')
const token = params.get('token')
const new_email = params.get('new_email')



function getMobilePlatform(){
    const ua = navigator.userAgent

    if(/android/i.test(ua)){
        return "android"
    }

    if(/iPad|iPhone|iPod/.test(ua)){
        return "ios"
    }

    return "other"
}
function redirectToApp(){
    const platform = getMobilePlatform()

    window.location.href = "commonground://"

    setTimeout(() => {
        if(platform === "android"){
            window.location.href = "https://duofine.com"
        }else if(platform === "ios"){
            window.location.href = "https://duofine.com"
        }
    }, 1500)
}


if(!uid || !token){
    document.body.innerHTML = "<div class='container-404'><h1>Invalid email change link.</h1></div>"
}else{
    async function sendActivationData(){
        try{
            let response = await fetch('https://api.duofine.com/user/change_email/', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: uid,
                    token: token,
                    new_email: new_email
                })
            })
            if(response.ok){
                document.body.innerHTML = `
                  <div class="container-404">
                    <h1>Email changed!</h1>
                    <h2>Redirecting to the app...</h2>
                    <button class="cta-button" onclick="window.location.href='commonground://'">Open App</button>
                  </div>
                `
                redirectToApp()
            }else{
                document.body.innerHTML = `<div class="container-404">
                                                <h1>Email Change failed. Link may be invalid or expired.</h1>
                                                <h2>If the issue persists please contact support at duofine.tr@gmail.com</h2>
                                           </div>`
            }
            }catch(e){
                document.body.innerHTML = "<div class='container-404'><h1>An error occurred. Please try again</h1></div>"
            }
        }
    sendActivationData()
}