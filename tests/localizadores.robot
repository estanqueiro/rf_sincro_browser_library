*** Settings ***
Library           SeleniumLibrary


*** Variables ***
${BROWSER}       chrome
${URL}           http://127.0.0.1:5500/index.html
${ROTA1}         \#/loc/ids-dinamicos
${ROTA2}         \#/loc/botoes-repetidos
${ROTA3}         \#/loc/checkboxes
${ROTA4}         \#/loc/shadow-dom
${ROTA5}         \#/loc/iframe


*** Test Cases ***
Ids gerados dinamicamente
    Open Browser    ${URL}${ROTA1}    ${BROWSER}
    Input Text      xpath://label[normalize-space(.)='Utilizador']/following-sibling::input    Paulo
    Input Text      xpath://label[normalize-space(.)='Senha']/following-sibling::input         123456
    Click Button    css:button.botao-entrar
    Wait Until Element Is Visible     css:p.mensagem    timeout=10s
    Element Text Should Be   css:p.mensagem   Bem-vindo, Paulo
    [TEARDOWN]      Close Browser

Botoes repetidos em cada linha
    Open Browser    ${URL}${ROTA2}    ${BROWSER}
    Click Element    xpath://tr[.//td[contains(.,'Ana Silva')]]//button[contains(@class,'btn-editar')]
    Wait Until Element Is Visible     css:p.cliente-em-edicao    timeout=10s
    Element Text Should Be   css:p.cliente-em-edicao   A editar: Ana Silva
    [TEARDOWN]      Close Browser

Checkboxes por linha
    Open Browser    ${URL}${ROTA3}    ${BROWSER}
    Click Element    css:input[type='checkbox'][value='Laptop']
    Click Element    css:input[type='checkbox'][value='Teclado mecânico']
    Wait Until Element Is Visible     css:p.contador-selecionados    timeout=10s
    Element Text Should Be   css:p.contador-selecionados   Selecionados: 2
    [TEARDOWN]      Close Browser

Componentes com Shadow DOM
    Open Browser    ${URL}${ROTA4}    ${BROWSER}
    Wait Until Page Contains Element    css:ficha-produto    timeout=10s
    Execute Javascript    document.querySelector('ficha-produto').shadowRoot.querySelector('button.adicionar').click()
    ${texto}    Execute Javascript    return document.querySelector('ficha-produto').shadowRoot.querySelector('.carrinho').textContent
    Should Contain   ${texto}    1 item
    [TEARDOWN]      Close Browser

Conteudo dentro de iframe
    Open Browser    ${URL}${ROTA5}    ${BROWSER}
    Select Frame    css:iframe.moldura
    Input Text      css:input.campo-pin    4321
    Click Button    xpath://button[contains(.,'Validar PIN')]
    Wait Until Element Is Visible     css:p.resultado-pin    timeout=10s
    Element Text Should Be   css:p.resultado-pin   PIN válido
    Unselect Frame
    [TEARDOWN]      Close Browser
