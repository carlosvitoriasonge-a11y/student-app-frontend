<script>
    import { apiFetch } from "$lib/api";
  
    let senhaPrivada = "";
    let senhaConfirm = "";
    let jsonPuro = null;
    let carregado = false;
    let senhaExiste = false;
  
    // --- estado do modal de troca de senha ---
    let trocarSenhaAberto = false;
    let senhaAtual = "";
    let novaSenha = "";
    let novaConfirm = "";
    let erroTroca = "";
    let sucessoTroca = "";
  
    // Verifica se já existe blob criptografado
    async function verificarSenhaExistente() {
      const blob = await apiFetch("/api/area-sensivel/ler");
      senhaExiste = !!blob.nonce && !!blob.ciphertext;
    }
  
    verificarSenhaExistente();
  
    async function gerarChave(senha) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(senha),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
  
      return crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: enc.encode("salt-fixo-area-sensivel"),
          iterations: 200000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
    }
  
    async function criptografar(json, senha) {
      const chave = await gerarChave(senha);
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
  
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: nonce },
        chave,
        enc.encode(JSON.stringify(json))
      );
  
      return {
        nonce: btoa(String.fromCharCode(...nonce)),
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
      };
    }
  
    async function descriptografar(blob, senha) {
      const chave = await gerarChave(senha);
      const nonce = Uint8Array.from(atob(blob.nonce), c => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(blob.ciphertext), c => c.charCodeAt(0));
  
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: nonce },
        chave,
        ciphertext
      );
  
      return JSON.parse(new TextDecoder().decode(decrypted));
    }
  
    // Criar senha inicial
    async function criarSenha() {
      if (senhaPrivada !== senhaConfirm) {
        alert("As senhas não coincidem");
        return;
      }
  
      const blob = await criptografar({}, senhaPrivada);
  
      await apiFetch("/api/area-sensivel/salvar", {
        method: "POST",
        body: JSON.stringify(blob)
      });
  
      senhaExiste = true;
    }
  
    // Entrar com senha existente
    async function entrar() {
      const blob = await apiFetch("/api/area-sensivel/ler");
  
      try {
        jsonPuro = await descriptografar(blob, senhaPrivada);
        carregado = true;
      } catch {
        alert("パスワードが正しくありません");
      }
    }
  
    // Salvar JSON com a senha atual
    export async function salvarAreaSensivel() {
      const blob = await criptografar(jsonPuro, senhaPrivada);
  
      await apiFetch("/api/area-sensivel/salvar", {
        method: "POST",
        body: JSON.stringify(blob)
      });
    }
  
    // --- TROCAR SENHA ---
    async function trocarSenha() {
      erroTroca = "";
      sucessoTroca = "";
  
      // 1. Verificar senha atual
      const blob = await apiFetch("/api/area-sensivel/ler");
  
      try {
        await descriptografar(blob, senhaAtual);
      } catch {
        erroTroca = "Senha atual incorreta";
        return;
      }
  
      // 2. Verificar nova senha
      if (novaSenha !== novaConfirm) {
        erroTroca = "Nova senha e confirmação não coincidem";
        return;
      }
  
      // 3. Recriptografar com nova senha
      const blobNovo = await criptografar(jsonPuro, novaSenha);
  
      await apiFetch("/api/area-sensivel/salvar", {
        method: "POST",
        body: JSON.stringify(blobNovo)
      });
  
      sucessoTroca = "Senha alterada com sucesso!";
      senhaPrivada = novaSenha;
    }
  </script>
  
  {#if !senhaExiste}
    <!-- Criar senha inicial -->
    <div class="senha-overlay">
      <h2>Criar senha da área sensível</h2>
      <input type="password" bind:value={senhaPrivada} placeholder="パスワード" />
      <input type="password" bind:value={senhaConfirm} placeholder="パスワード確認" />
      <button on:click={criarSenha}>パスワードを設定する</button>
    </div>
  
  {:else if !carregado}
    <!-- Login -->
    <div class="senha-overlay">
      <h2>Área protegida</h2>
      <input type="password" bind:value={senhaPrivada} placeholder="パスワード" />
      <button on:click={entrar}>事務ページへ移動</button>
    </div>
  
  {:else}
    <!-- Conteúdo + botão de troca de senha -->
    <button on:click={() => trocarSenhaAberto = true}>
        パスワードを変更する
    </button>
  
    <slot {jsonPuro} {salvarAreaSensivel}></slot>
  
    {#if trocarSenhaAberto}
      <div class="modal">
        <h3>パスワードを変更する</h3>
  
        {#if erroTroca}
          <p style="color:red">{erroTroca}</p>
        {/if}
  
        {#if sucessoTroca}
          <p style="color:green">{sucessoTroca}</p>
        {/if}
  
        <input type="password" bind:value={senhaAtual} placeholder="現在のパスワード" />
        <input type="password" bind:value={novaSenha} placeholder="新しいパスワード" />
        <input type="password" bind:value={novaConfirm} placeholder="新しいパスワード（確認用）" />
  
        <button on:click={trocarSenha}>保存</button>
        <button on:click={() => trocarSenhaAberto = false}>閉じる</button>
      </div>
    {/if}
  {/if}
  