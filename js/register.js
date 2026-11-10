import { supabase } from "./supabase.js";
const form=document.getElementById("registerForm"), errorBox=document.getElementById("registerError"), successBox=document.getElementById("registerSuccess"), button=document.getElementById("registerSubmit");
form?.addEventListener("submit",async e=>{
 e.preventDefault(); errorBox.textContent=""; successBox.textContent=""; if(!form.reportValidity()) return;
 const nome=form.elements.name.value.trim(), email=form.elements.email.value.trim().toLowerCase(), password=form.elements.password.value, confirm=form.elements.confirmPassword.value;
 if(password!==confirm){errorBox.textContent="As senhas não coincidem.";return;}
 if(Array.from(password).length<12){errorBox.textContent="A senha deve conter pelo menos 12 caracteres.";return;}
 button.disabled=true; button.textContent="Criando conta...";
 try {
  const {error}=await supabase.auth.signUp({email,password,options:{data:{nome}}});
  if(error) throw error;
  form.reset(); successBox.textContent="Cadastro realizado. Verifique seu e-mail para confirmar a conta e entre após a confirmação.";
 } catch(err){errorBox.textContent=err.message||"Não foi possível criar a conta.";}
 finally{button.disabled=false;button.textContent="Enviar solicitação";}
});
