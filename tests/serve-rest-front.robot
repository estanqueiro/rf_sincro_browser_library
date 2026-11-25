*** Settings ***
Resource          ../resources/serve-rest-front.resource

Suite Setup    Cadastrar usuário e logar

*** Variables ***


*** Test Cases ***
Login com sucesso serve rest front
    Abrir o navegador
    Ir para o site Serve Rest Front
    Cadastrar novo usuário
    Conferir usuário cadastrado com sucesso

Conferir se o novo usuário é mostrado na listagem de usuários
    # Abrir o navegador
    # Ir para o site Serve Rest Front   
    # ${email}    Cadastrar novo usuário
    Abrir o site Serve Rest Front logado
    Acessar a lista de usuários
    Conferir que o usuário aparece na listagem

Cadastrar produto
    # Abrir o navegador
    # Ir para o site Serve Rest Front 
    Abrir o site Serve Rest Front logado
    ${produto}    Cadastrar novo produto
    Conferir que o produto aparece na listagem    ${produto}

Exemplo utilizando Requisições HTTP
    Abrir o navegador
    Ir para o site Serve Rest Front
    ${email}    Criar usuário via API
    Logar com o usuário cadastrado via API

Exemplo utilizando o Storage armazenado no contexto
    Abrir o site Serve Rest Front logado
    Acessar a lista de usuários