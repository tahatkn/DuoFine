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
            let response = await fetch('https://api.duofine.com/user/change_password/', {
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
                  <div class="status-container">
                    <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <h1>Password Changed!</h1>
                    <h2>Redirecting to the app...</h2>
                    <button class="cta-button" onclick="window.location.href='commonground://'">Open App</button>
                  </div>
                `
                redirectToApp()
            }else{
                document.body.innerHTML = `<div class="status-container">
                                                <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                <h1>Password change failed.</h1>
                                                <h2>Link may be invalid or expired. If the issue persists please contact support at duofine.tr@gmail.com</h2>
                                           </div>`
            }
            }catch(e){
                document.body.innerHTML = `<div class="status-container">
                    <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <h1>An error occurred.</h1>
                    <h2>Please try again.</h2>
                </div>`
            }
        }


if(!uid || !token){
    document.body.innerHTML = `<div class="status-container">
        <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h1>Invalid password change link.</h1>
    </div>`
}