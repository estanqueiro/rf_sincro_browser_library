*** Settings ***
Library           SeleniumLibrary


*** Variables ***
${BROWSER}       chrome
${URL}           http://127.0.0.1:5500/index.html
${ROTA1}         \#/sync/carregamento-atrasado
${ROTA2}         \#/sync/barra-progresso
${ROTA3}         \#/sync/elemento-volatil
${ROTA4}         \#/sync/tabela-assincrona
${ROTA5}         \#/sync/scroll-infinito
${ROTA6}         \#/sync/autocomplete
${ROTA7}         \#/sync/modal-toast


*** Test Cases ***
Carregamento com atraso
    Open Browser    ${URL}${ROTA1}    ${BROWSER}
    Click Button    id:btn-carregar
    Wait Until Element Is Visible    css:.resultado ul     timeout=10s
    Element Text Should Be           css:.resultado ul li:first-child    Sensor de temperatura
    [TEARDOWN]      Close Browser

Barra de progresso ativa botao
    [Tags]    Ready
    Open Browser    ${URL}${ROTA2}    ${BROWSER}
    Click Button    xpath://button[normalize-space()='Iniciar processamento']
    Wait Until Element Is Enabled     id:btn-concluir    timeout=15s
    Click Button    id:btn-concluir
    Wait Until Element Is Visible     css:p.mensagem-final    timeout=10s
    Element Text Should Be            css:p.mensagem-final    Pedido concluído
    [TEARDOWN]      Close Browser

Elemento que muda de id
    Open Browser    ${URL}${ROTA3}    ${BROWSER}
    # Wait Until Element Is Visible    xpath://button[normalize-space(.)='Confirmar reserva']    timeout=10s
    Click Button    xpath://button[normalize-space()='Confirmar reserva']
    Wait Until Element Is Visible     css:p.estado-reserva    timeout=10s
    ${mensagem}    Get Text    css:p.estado-reserva
    Should Match Regexp    ${mensagem}    ^Reserva #\\d+ confirmada$
    [TEARDOWN]      Close Browser

Tabela assincrona com busca
    Open Browser    ${URL}${ROTA4}    ${BROWSER}
    Click Element    css:input.campo-busca
    Input Text       css:input.campo-busca    monitor 2
    Wait Until Element Is Visible     xpath://td[normalize-space()='Monitor 27"']    timeout=10s
    Element Text Should Be            css:p.contador-resultados    2 resultados
    ${linhas}    Get Element Count    css:table.tabela-produtos tbody tr
    Should Be Equal As Integers    ${linhas}    2
    [TEARDOWN]      Close Browser

Scroll infinito
    Open Browser    ${URL}${ROTA5}    ${BROWSER}
    Execute Javascript    document.querySelector('.feed').scrollTop = 999999
    # Press Keys                       css:.feed    END
    Wait Until Element Is Visible    xpath://span[@class='id-feed'][normalize-space()='#20']    timeout=10s
    ${items}    Get Element Count    css:div.feed-item
    Should Be True   ${items} >= 20
    [TEARDOWN]      Close Browser

Autocomplete com sugestões atrasadas
    Open Browser    ${URL}${ROTA6}    ${BROWSER}
    # Click Element    css:input.campo-cidade
    Input Text       css:input.campo-cidade    por
    Wait Until Element Is Visible     css:ul.sugestoes li    timeout=10s
    Click Element    xpath://button[@class='item-sugestao'][normalize-space()='Porto']
    Wait Until Element Is Visible     css:p.cidade-escolhida    timeout=10s
    Element Text Should Be            css:p.cidade-escolhida    Cidade escolhida: Porto
    [TEARDOWN]      Close Browser

Modal de confirmação e toast
    Open Browser    ${URL}${ROTA7}    ${BROWSER}
    Input Text    css:input.campo-nome     Paulo
    Input Text    css:input.campo-email    paulo@paulo.com
    Wait Until Element Is Enabled     css:button.btn   timeout=10s
    Click Button    css:button.btn
    Wait Until Element Is Visible     css:div.caixa-modal     timeout=10s
    Click Button    css:button.btn-confirmar
    Wait Until Element Is Visible        css:div.toast    timeout=10s
    Element Text Should Be               css:div.toast    Alterações guardadas com sucesso
    Wait Until Element Is Not Visible    css:div.toast    timeout=10s
    [TEARDOWN]      Close Browser
