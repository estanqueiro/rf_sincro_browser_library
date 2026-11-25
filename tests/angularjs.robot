*** Settings ***
Library           SeleniumLibrary


*** Variables ***
${BROWSER}       chrome
${URL}           http://127.0.0.1:5500/angular.html


*** Test Cases ***
Busca de clientes com filtro ng-repeat
    Open Browser    ${URL}    ${BROWSER}
    Input Text      css:input.campo-busca-clientes    costa
    Wait Until Element Is Visible    xpath://tr[contains(@class,'linha-client')][contains(.,'Bruno Costa')]
    ${linhas}    Get Element Count   xpath://tr[contains(@class,'linha-client')]
    Should Be Equal As Integers   ${linhas}   1
    Element Text Should Be   css:p.contador-clientes   1 clientes
    [TEARDOWN]      Close Browser

Ng-if vs ng-show - a armadilha classica
    [Tags]    Ready
    Open Browser    ${URL}    ${BROWSER}
    Scroll Element Into View         xpath://button[normalize-space(.)='Ver pagamentos (ng-if)']
    Click Button    xpath://button[normalize-space(.)='Ver pagamentos (ng-if)']
    Element Should Be Visible        css:div.painel-pagamentos
    Click Button    xpath://button[normalize-space(.)='Ver faturas (ng-if)']
    Element Should Not Be Visible    css:div.painel-pagamentos
    Element Should Be Visible        css:div.painel-faturas
    Click Button    xpath://button[normalize-space(.)='Alternar detalhes (ng-show)']
    Page Should Contain Element      css:div.painel-extra
    Element Should Be Visible        css:div.painel-extra
    Click Button    xpath://button[normalize-space(.)='Alternar detalhes (ng-show)']
    Page Should Contain Element      css:div.painel-extra
    Element Should Not Be Visible    css:div.painel-extra
    [TEARDOWN]      Close Browser

Lista de tarefas com ng-click
    [Tags]    Ready
    Open Browser    ${URL}    ${BROWSER}
    Scroll Element Into View    css:input.campo-nova-tarefa
    Input Text    css:input.campo-nova-tarefa    Correr a suite de regressao
    Click Button    xpath://button[normalize-space(.)='Adicionar']
    Wait Until Element Is Visible    xpath://li[contains(@class,'item-tarefa')]//span[contains(.,'Correr a suite de regressao')]
    Element Text Should Be    css:p.contador-tarefas    4 tarefas
    Scroll Element Into View    xpath:(//li[contains(@class,'item-tarefa')]//button[contains(@class,'btn-remover')])[1]
    Click Element    xpath:(//li[contains(@class,'item-tarefa')]//button[contains(@class,'btn-remover')])[1]
    Element Text Should Be    css:p.contador-tarefas    3 tarefas
    [TEARDOWN]      Close Browser
