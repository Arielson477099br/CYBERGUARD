import { supabase } from "./supabase.js";
const form=document.getElementById("loginForm"), errorBox=document.getElementById("loginError"), button=document.getElementById("loginSubmit");
form?.addEventListener("submit",async e=>{
 e.preventDefault(); errorBox.textContent=""; if(!form.reportValidity()) return;
 button.disabled=true; button.textContent="Validando...";
 try {
  const email=form.elements.email.value.trim().toLowerCase(), password=form.elements.password.value;
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error) throw error;
  location.replace("index.html");
 } catch(err) { errorBox.textContent=err.message || "Não foi possível autenticar."; }
 finally {button.disabled=false;button.textContent="Entrar no sistema";}
});
