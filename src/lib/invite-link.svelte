<script lang="ts">
  import { page } from "$app/stores";
  
  const absoluteUrl = $page.url.toString();
  
  function copyInviteLink() {
    navigator.clipboard.writeText(absoluteUrl);
  }
</script>

<h3>Invite a friend</h3>
<div class="form-field">
  <input type="text" value={absoluteUrl} readonly />
  <button class="big-button" on:click={copyInviteLink}>COPY</button>
</div>

<style>
  .big-button {
    margin: 0;
  }

  .form-field {
    justify-self: stretch;
    width: 100%;
  }

  input {
    margin-left: 0;
  }
</style>