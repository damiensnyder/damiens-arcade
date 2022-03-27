<script lang="ts">
  import { page } from "$app/stores";
  
  const absoluteUrl = $page.url.toString();

  function highlightText() {
    this.select();
  }
  
  function copyInviteLink() {
    navigator.clipboard.writeText(absoluteUrl);
  }
</script>

<h3>Invite a friend</h3>
<div class="form-field">
  <input type="text" value={absoluteUrl} on:focus={highlightText} readonly />
  <button class="big-button" on:click={copyInviteLink}>COPY</button>
</div>

<style>
  .big-button {
    margin: 0;
  }

  .form-field {
    align-self: stretch;
    justify-self: stretch;
    width: 100%;
  }

  input[type=text] {
    margin-left: 0;
  }
</style>