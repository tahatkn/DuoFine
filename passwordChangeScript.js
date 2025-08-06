const params = new URLSearchParams(window.location.search)
const uid = params.get('uid')
const token = params.get('token')
const passwordBtn = document.getElementById('passwordBtn')
const regex = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/
const resultText = document.getElementById("resultText")


passwordBtn.addEventListener("click", () => {
    const passwordOne = document.getElementById('passwordOne').value
    const passwordTwo = document.getElementById('passwordTwo').value
    if(passwordOne == passwordTwo){
        if(passwordOne.length > 7 && passwordTwo.length > 7 && regex.test(passwordOne)){
            sendPasswordChange(passwordOne)
        }else{
            resultText.textContent = "Password must be longer than 8 characters and contain special characters!"
        }
    }else{
        resultText.textContent = "Passwords dont match!"
    }
})


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

async function sendPasswordChange(password){
        try{
            let response = await fetch('https://commongroundapi-production.up.railway.app/user/change_password/', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid: uid,
                    token: token,
                    password: password
                })
            })
            if(response.ok){
                document.body.innerHTML = `
                  <h1>Password Changed!</h1>
                  <h2>Redirecting to the app...</h2>
                  <button onclick="window.location.href='commonground://'">Open App</button>
                `
                redirectToApp()
            }else{
                document.body.innerHTML = `<h1>Password change failed. Link may be invalid or expired.</h1>
                                            <h2>If the issue persists please contact support at cg@support.com
                `
            }
            }catch(e){
                document.body.innerHTML = "<h1>An error ocurred. Please try again</h1>"
            }
        }


if(!uid || !token){
    document.body.innerHTML = "<h1>Invalid password change link.</h1>"
}