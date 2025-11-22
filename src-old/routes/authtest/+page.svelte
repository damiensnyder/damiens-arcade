<script lang="ts">
  import { onMount } from 'svelte';
  
  
  export const checkAuthStatus = async () => {
    try {
      // Hit the Django endpoint that checks auth and sets the cookie
      const response = await fetch('http://www.ownsite.local:8000/account/sso/', {
        method: 'GET',
        credentials: 'include', // Important for cookies to be sent
      });
      
      const data = await response.json();
      
      console.log(data);
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  onMount(() => {
    checkAuthStatus();
  });
</script>

<p>hi</p>