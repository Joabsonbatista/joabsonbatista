document.addEventListener('DOMContentLoaded', () => {
  // --- Otimização de Carregamento de Fontes (para CSP) ---
  const fontLink = document.getElementById('google-fonts');
  if (fontLink) {
    // Carrega a folha de estilos da fonte de forma não bloqueante
    fontLink.media = 'all';
  }

  // --- Lógica para o menu hambúrguer ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  const nav = document.querySelector('nav');

  if (hamburger && navLinks && nav) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      hamburger.setAttribute('aria-expanded', isExpanded);
    });
  }

  // --- Funções Auxiliares (Escopo Local) ---
  function salvarLocalmente(nome, email, mensagem) {
    try {
      const consentEl = document.getElementById('consent');
      const hasConsent = !!(consentEl && consentEl.checked);
      // Não salvar se não houver consentimento
      if (!hasConsent) return;
      // Validações básicas
      if (!nome && !email && !mensagem) return;
      const raw = localStorage.getItem('mensagens');
      let mensagens = [];
      try { mensagens = raw ? JSON.parse(raw) : []; } catch (e) { mensagens = []; }
      mensagens.push({ nome: String(nome), email: String(email), mensagem: String(mensagem), consent: hasConsent, data: new Date().toISOString() });
      // Tentativa de persistência com tratamento de quota
      try { localStorage.setItem('mensagens', JSON.stringify(mensagens)); }
      catch (setErr) { console.warn('Falha ao salvar localmente:', setErr); }
    } catch (ex) {
      // Silenciar erros de storage para não quebrar a UX
      console.warn('salvarLocalmente falhou:', ex);
    }
  }

  function mostrarErro(campo, mensagem) {
    const input = document.getElementById(campo);
    const erroSpan = document.getElementById('erro-' + campo);
    if (input) { input.classList.add('error'); }
    if (erroSpan) { erroSpan.textContent = mensagem; }
  }

  function limparErros() {
    const inputs = document.querySelectorAll('input.error, textarea.error');
    inputs.forEach(input => {
      input.classList.remove('error');
    });
    const erros = document.querySelectorAll('.erro');
    erros.forEach(erro => {
      erro.textContent = '';
    });
  }

  // --- Lógica do Formulário ---
  const form = document.getElementById('form-contato');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const mensagemInput = document.getElementById('mensagem');
  const consentInput = document.getElementById('consent');
  const sucessoMsg = document.getElementById('sucesso-mensagem');
  const erroEnvio = document.getElementById('erro-envio');
  const honeypotInput = document.getElementById('honeypot');

  // Função para limpar os dados do formulário salvos na sessão
  function clearSavedFormData() {
    sessionStorage.removeItem('form_nome');
    sessionStorage.removeItem('form_email');
    sessionStorage.removeItem('form_mensagem');
  }

  if (form) {
    // Restaura os dados do formulário da sessão ao carregar a página
    if (sessionStorage.getItem('form_nome')) nomeInput.value = sessionStorage.getItem('form_nome');
    if (sessionStorage.getItem('form_email')) emailInput.value = sessionStorage.getItem('form_email');
    if (sessionStorage.getItem('form_mensagem')) mensagemInput.value = sessionStorage.getItem('form_mensagem');

    // Salva os dados na sessão enquanto o usuário digita
    nomeInput.addEventListener('input', () => sessionStorage.setItem('form_nome', nomeInput.value));
    emailInput.addEventListener('input', () => sessionStorage.setItem('form_email', emailInput.value));
    mensagemInput.addEventListener('input', () => sessionStorage.setItem('form_mensagem', mensagemInput.value));

    form.addEventListener('submit', function(e) {
    e.preventDefault(); // Impede o envio padrão

    // --- Honeypot Spam Check ---
    // Se o campo escondido (honeypot) for preenchido, é provável que seja um bot.
    if (honeypotInput && honeypotInput.value !== '') {
      console.warn('Honeypot acionado. Bloqueando envio de spam.');
      // Simulamos um envio bem-sucedido para enganar o bot.
      if (sucessoMsg) {
        sucessoMsg.textContent = 'Mensagem enviada com sucesso!';
        sucessoMsg.classList.add('show');
        setTimeout(() => { sucessoMsg.classList.remove('show'); }, 4000);
      }
      form.reset(); // Limpa o formulário
      clearSavedFormData(); // Limpa os dados salvos
      return; // Interrompe a execução
    }

    // Limpar erros anteriores
    limparErros();

    // Obter valores
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const mensagem = mensagemInput.value.trim();

    let valido = true;
    let primeiroErro = null;

    // Validar nome
    if (nome === '') {
      mostrarErro('nome', 'Por favor, digite seu nome.');
      valido = false;
      primeiroErro = primeiroErro || nomeInput;
    } else if (nome.length > 50) {
      mostrarErro('nome', 'O nome deve ter no máximo 50 caracteres.');
      valido = false;
      primeiroErro = primeiroErro || nomeInput;
    }

    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === '') {
      mostrarErro('email', 'O e-mail é obrigatório.');
      valido = false;
      primeiroErro = primeiroErro || emailInput;
    } else if (!emailRegex.test(email)) {
      mostrarErro('email', 'Digite um e-mail válido.');
      valido = false;
      primeiroErro = primeiroErro || emailInput;
    }

    // Validar mensagem
    if (mensagem === '') {
      mostrarErro('mensagem', 'Escreva sua mensagem.');
      valido = false;
      primeiroErro = primeiroErro || mensagemInput;
    } else if (mensagem.length < 10) {
      mostrarErro('mensagem', 'Sua mensagem deve ter pelo menos 10 caracteres.');
      valido = false;
      primeiroErro = primeiroErro || mensagemInput;
    } else if (mensagem.length > 500) {
      mostrarErro('mensagem', 'Sua mensagem deve ter no máximo 500 caracteres.');
      valido = false;
      primeiroErro = primeiroErro || mensagemInput;
    }

    // Focar no primeiro campo com erro
    if (primeiroErro) {
      primeiroErro.focus();
    }

    // Se tudo estiver válido
    if (valido) {
      // Verificar consentimento
      if (consentInput && !consentInput.checked) {
        mostrarErro('consent', 'Você precisa aceitar a política de privacidade.');
        consentInput.focus();
        return;
      }

      // Desabilitar botão para evitar envios múltiplos
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
      }

      const action = form.getAttribute('action');
      // Preparar dados para envio
      const formData = new FormData();
      formData.append('name', nome);
      formData.append('_replyto', email);
      formData.append('message', mensagem);

      // Se action apontar para Formspree (ou outro endpoint), tentar enviar via fetch
      if (action && action.includes('formspree.io')) {
        fetch(action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        }).then(response => {
          if (response.ok) {
            // sucesso
            form.reset();
            clearSavedFormData();
            if (sucessoMsg) {
              sucessoMsg.textContent = 'Mensagem enviada com sucesso!';
              sucessoMsg.classList.add('show');
              setTimeout(() => { sucessoMsg.classList.remove('show'); }, 4000);
            }
          } else {
            return response.json().then(data => { throw data; });
          }
        }).catch(err => {
          // Log de aviso (evitar expor dados sensíveis em console de produção)
          console.warn('Erro no envio para o Formspree:', err);
          if (erroEnvio) erroEnvio.textContent = 'Erro ao enviar. Mensagem salva localmente.';
          // fallback: salvar localmente (apenas com consentimento)
          salvarLocalmente(nome, email, mensagem);
        }).finally(() => {
          // Reabilitar o botão após o envio (sucesso ou falha)
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Mensagem';
          }
        });
      } else {
        // Sem endpoint configurado: salvar localmente como fallback
        salvarLocalmente(nome, email, mensagem);
        form.reset();
        clearSavedFormData();
        if (sucessoMsg) {
          sucessoMsg.textContent = 'Mensagem salva localmente.';
          sucessoMsg.classList.add('show');
          setTimeout(() => { sucessoMsg.classList.remove('show'); }, 4000);
        }
        // Reabilitar o botão também no fallback
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Enviar Mensagem';
        }
      }
    }
  });
  }

  // --- Lógica do Rodapé ---
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- Lógica para evitar "flash" do menu no redimensionamento ---
  let resizeTimer;
  window.addEventListener('resize', () => {
    // Adiciona a classe para desativar transições
    document.body.classList.add('is-resizing');
    // Limpa o timer anterior para garantir que a classe só seja removida após o fim do redimensionamento
    clearTimeout(resizeTimer);
    // Configura um timer para remover a classe após um breve período sem redimensionar
    resizeTimer = setTimeout(() => document.body.classList.remove('is-resizing'), 250);
  });

  // --- Lógica do Botão "Voltar ao Topo" ---
  const backToTopButton = document.querySelector('.back-to-top');
  if (backToTopButton) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) { // Mostra o botão após rolar 300px
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    });
  }

  // --- Lógica para destacar link ativo na navegação ---
  const sections = document.querySelectorAll('section[id]');
  const navLinksList = document.querySelectorAll('.nav-links a');
  const header = document.querySelector('header');

  if (sections.length > 0 && navLinksList.length > 0 && header) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Pega o link da navegação que corresponde à seção atual
        const id = entry.target.getAttribute('id');
        const navLink = document.querySelector(`.nav-links a[href="#${id}"]`);
        
        if (entry.isIntersecting && navLink) {
          // Remove a classe ativa de todos os links
          navLinksList.forEach(link => link.classList.remove('active-link'));
          // Adiciona a classe ativa ao link correspondente
          navLink.classList.add('active-link');
        }
      });
    }, {
      // Ajusta a área de observação para compensar a altura do cabeçalho fixo
      rootMargin: `-${header.offsetHeight}px 0px -40% 0px`,
      threshold: 0 // Ativa assim que qualquer parte da seção (considerando o rootMargin) entra na tela
    });

    sections.forEach(section => observer.observe(section));
  }

  // --- Lógica para animação de scroll (fade-in) ---
  const animatedElements = document.querySelectorAll('.fade-in-element');
  if (animatedElements.length > 0) {
    const scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Opcional: parar de observar o elemento depois que ele se torna visível para otimizar
          scrollObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1 // Ativa quando 10% do elemento está visível
    });

    animatedElements.forEach(el => scrollObserver.observe(el));
  }

  // --- Lógica Unificada de Scroll Suave ---
  // Delega o evento de clique para o body para capturar todos os links de âncora da página
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    
    // Garante que o link existe e pertence à página atual (não é um link para outra página como privacy.html)
    if (!link || new URL(link.href).pathname !== window.location.pathname) {
      return;
    }

    e.preventDefault();
    const targetElement = document.querySelector(link.getAttribute('href'));

    // Fecha o menu mobile se estiver aberto e o clique veio de dentro dele
    if (navLinks && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});