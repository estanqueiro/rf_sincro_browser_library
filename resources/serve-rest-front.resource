*** Settings ***
Library           Browser
# ...    enable_presenter_mode=${true}
Library           FakerLibrary

*** Variables ***
${BROWSER}            chromium
${HEADLESS}           True
${SITE_SERVE_REST}    https://front.serverest.dev/login       
${EMAIL_LOGIN}        css:input[data-testid="email"]
${SENHA_LOGIN}        css:input[data-testid="senha"]
${BOTAO_ENTRAR}       css:button[data-testid="entrar"]

*** Keywords ***
Abrir o navegador
    New Browser    browser=${BROWSER}
    ...            headless=${HEADLESS}
    New Context    viewport={'width': 1280, 'height': 800}

Ir para o site Serve Rest Front
    New Page       url=${SITE_SERVE_REST}
    Get Title  ==  Front - ServeRest

Cadastrar novo usuário
    Click        css=a[data-testid="cadastrar"]
    ${EMAIL}     Email
    Set Suite Variable    ${EMAIL}
    Fill Text    css=input[data-testid="nome"]        Paulo
    Fill Text    css=input[data-testid="email"]       ${EMAIL}
    Fill Text    css=input[data-testid="password"]    senha123
    Check Checkbox    css=input[data-testid="checkbox"]
    Click        css=button[data-testid="cadastrar"]

Conferir usuário cadastrado com sucesso
    # Wait For Elements State    css=h1    visible
    Get Text    css=h1  ==  Bem Vindo Paulo
    Get Element States    css=button[data-testid="logout"]  validate  value & visible

Acessar a lista de usuários
    Wait For Elements State    css=[data-testid="listar-usuarios"]    visible
    Click       css=a[data-testid="listar-usuarios"]
    Get Text    css=h1  ==  Lista dos usuários  

Conferir que o usuário aparece na listagem
    ${elemento}    Get Table Cell Element    css=table    "Nome"    "${EMAIL}"
    Get Text       ${elemento}  ==  Paulo
    Highlight Elements    ${elemento}
    Take Screenshot       fullPage=${true}

Cadastrar novo produto
    Click        css=a[data-testid="cadastrar-produtos"]
    VAR    ${produto}    Consultoria de automação de testes
    Fill Text    css=input[data-testid="nome"]        ${produto} 
    Fill Text    css=input[data-testid="preco"]       10000
    Fill Text    css=textarea[data-testid="descricao"]    Pacote de 40 horas de consultoria para melhoria do processo de automação
    Fill Text    css=input[data-testid="quantity"]    1
    #Click        css=input[data-testid="imagem"]
    Upload File By Selector    css=input[data-testid="imagem"]    /Users/estanqueiro/Downloads/Consultoria.md
    Click    css=button[data-testid="cadastarProdutos"]
    RETURN    ${produto}

Conferir que o produto aparece na listagem
    [Arguments]    ${produto}
    Click    css=a[data-testid="listar-produtos"]
    ${elemento}    Get Table Cell Element    css=table    "Nome"    "${produto}"
    Get Text    ${elemento}  ==  ${produto}

Criar usuário via API
    ${email}     Email
    ${resposta}    Http    url=https://serverest.dev/usuarios
    ...                    method=POST
    ...                    body={"nome":"Paulo","email":"${email}","password":"123456","administrador":"true"}
    Should Be Equal As Integers    ${resposta["status"]}    201
    Set Test Variable     ${EMAIL}

Logar com o usuário cadastrado via API
    ${resposta}    Http    url=https://serverest.dev/login
    ...                    method=POST
    ...                    body={"email":"${EMAIL}","password":"123456"}
    Should Be Equal As Integers    ${resposta["status"]}    200
    
    LocalStorage Set Item    key=serverest/userEmail    value=${EMAIL}
    LocalStorage Set Item    key=serverest/userToken    value=${resposta["body"]["authorization"]}  
    LocalStorage Set Item    key=serverest/userNome     value=Paulo

    Go To    url=https://front.serverest.dev/admin/home

    Take Screenshot

Cadastrar usuário e logar
    New Browser
    New Page    url=${SITE_SERVE_REST}
    Criar usuário via API
    Logar com o usuário cadastrado via API 
    ${STORAGE_FILE}    Save Storage State
    Set Suite Variable    ${STORAGE_FILE}

Abrir o Site Serve Rest Front logado
    New Browser    browser=${BROWSER}
    ...            headless=${HEADLESS}
    New Context    viewport={"width": 1200, "height": 800}
    ...            storageState=${STORAGE_FILE}
    New Page       url=https://front.serverest.dev/admin/home
    Get Text       h1  ==  Bem Vindo Paulo
    Take Screenshot