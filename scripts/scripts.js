/*globals console, CryptoJS */
/*globals SName, STags,ELink,ELogin,EBody, Auth, Decode*/
/*globals escape,unescape*/
var GeneratedPassword = '';


// используем библиотеку webdav
// https://github.com/aslakhellesoy/webdavjs

// количество нажатий на ESC для logout
//let default_esc_number_press_to_out = 4;
// количество нажатий Enter при неправильно ввевденной passphrase
let default_enter_number_press_to_in = 4;


//Состояние приложения
var app = {
    // логин webdav
    webdavLogin: '' || 'Enter login to webdav server',
    // пароль webdav
    webdavPassword: '' || 'Enter password to webdav server',
    // webdav сервер 
    webdavServer: '' || 'Enter address webdav server',
    // webdav порт
    webdavServerPort: '' || '443',
    // webdav протоколсервер 
    webdavServerProtocol: '' || 'https',
    // полный путь хранения файлов webdav, включая '/'
    webdavPathFolder: '' || '/keymemo-webdav/',

    // идет проверка "есть ли список новее"
    isCheck_where_newer_list_secret: true,
    // было изменение - необходимо сохранить
    need_save_value: false,

    // фраза приветствия
    welcome_phrase_element: document.getElementById('welcome_phrase'),
    // в настройках, используется при изменении фразы
    new_welcome_phrase_element: document.getElementById('new_welcome_phrase'),
    enter_number_press_to_in: 0,
    // маска для файлов с секретами
    fileNameMask: "keymemo_",
    // ** интерфейс **
    page_container: document.getElementById('page_container'),
    // параметры заголовка
    header_input: document.getElementById('header_input'),
    header_input_div: document.getElementById('header_input_div'),
    online_offline: document.getElementById('online_offline'),
    header_button: document.getElementById('headerButton'),
    header_link: document.getElementById('headerLink'),
    last_change_list_secrets: document.getElementById('last_change_list_secrets'),
    div_edited_secret: document.getElementById('edited_secret'),
    // spinner
    spinner: document.getElementById('spinner'),
    // спиннер "Save"
    spinner_save: document.getElementById('spinner_save'),
    // таймер
    autosave_in_element: document.getElementById('autosave_in'),
    //default_PassPhrase
    passPhrase: '',
    // div список секретов
    div_view_secrets: document.getElementById('view_secrets'),
    div_settings: document.getElementById('div_settings'),
    select_secrets_and_control_elements: document.getElementById('select_secrets_and_control_elements'),
    import_from_keymemo_com_button: document.getElementById('import_from_keymemo_com_button'),

    keyboardLayout_element: document.getElementById('keyboardLayout'),
    header_input_placeholder: document.getElementById('header_input_placeholder'),
    // если запуск с локального диска - возвращем true
    start_from_local_disk: ('file:' === window.location.protocol.toString()) ? true : false,
    // если запускаемся с keymemo.github.io - возвращаем true
    start_from_keymemo_github_io: ('keymemo.github.io' === window.location.hostname.toString()) ? true : false,
    // таймер обновления времени последнего изменения
    timer_out_update_last_change_list_secrets: 0,
    // таймер для обновления каждый час каждый
    timer_every_hour: 0,
    // таймер для скрола
    timer_smooth_scrolling: 0,
    // Задержка для анимации поиска
    timeout_search_animation: 0,
    // таймер поиска
    timer_search: 0,
    // круговая диаграммы для отсчета минуты
    pie_element: document.getElementById('pie'),
    // таймер обратного отсчета
    timer_div_element: document.getElementById('timer_div'),
    input_value_custom: "",

    // для отладки
    debug: true
};

//    // список секретов, храним в
//    div_list_secrets: document.getElementById('div_list_secrets'),
app.div_list_secrets = function () {
    'use strict';
    return document.getElementById('div_list_secrets');
};

// для откладки
app.debugLog = function (text) {
    'use strict';
    if (app.debug) {
        console.log(text);
    }
};
// необходимо сохранение
app.need_save = function () {
    'use strict';
    app.need_save_value = true;
    app.online_offline.innerHTML = 'Need to SAVE!!!';
    //    app.online_offline.classList.remove("blink_text");
    app.online_offline.classList.add("blink_text");
};

// ctrl-f отменяет стандартный поиск и переносит фокус на поле ввода
window.addEventListener("keydown", function (e) {
    'use strict';
    if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
        e.preventDefault();
        header_input.focus();
    }
});

// возвращает дату изменения списка секретов в localStorage
app.get_date_change_list_secret = function () {
    'use strict';
    return app.div_list_secrets().getAttribute('data-lastchange');
};

// имя файла для сохранения
app.file_name_for_save = function () {
    'use strict';
    return app.fileNameMask + app.get_date_change_list_secret() + '.html';
};

// возвращает в виде строки и даты разницу между текущим временем и переданным
app.data_change_diff_now = function (date) {
    'use strict';
    return (app.data_difference(date) +
        '<br><span class="lastChange_secret_title">' + date + '</span>');
};

// вывод даты изменения списка секретов
app.show_last_change_list_secrets = function () {
    'use strict';
    app.last_change_list_secrets.innerHTML = app.data_change_diff_now(app.get_date_change_list_secret());

    // разница между "сейчас" и временем изменения списком секрета в секундах
    function date_diff_last_change() {
        return (app.now() - app.data_getTime(app.get_date_change_list_secret())) / 1000;
    }

    // таймер для обновления даты изменения списка секретов
    clearTimeout(app.timer_out_update_last_change_list_secrets);
    app.timer_out_update_last_change_list_secrets =
        setTimeout(function () {
                app.show_last_change_list_secrets();
                // проверка нет ли более новой версии файла секретов каждый час
                if (date_diff_last_change() > 3600) {
                    // сброс старого таймера
                    clearTimeout(app.timer_every_hour);
                    // проверка где новее секрет
                    app.timer_every_hour = setTimeout(
                        app.check_where_newer_list_secret,
                        1);
                }
            },
            (date_diff_last_change() < 60) ? 1 * 1000 :
            ((date_diff_last_change() < 3600) ? 60 * 1000 :
                3600 * 1000)
        );

    // если запускается на https://keymemo.github.io/
    // то предложить инструкцию по размещению на своих мощностях
    if (app.start_from_keymemo_github_io) {
        // ссылка на инструкцию
        app.last_change_list_secrets.innerHTML = app.last_change_list_secrets.innerHTML +
            '<p><a href="https://github.com/keymemo/keymemo.github.io/blob/master/place_on_your_site.md" target="_blank" class="link_external">Place on your site(self-hosted).</a></p>';
        // ссылка на commits
        app.last_change_list_secrets.innerHTML = app.last_change_list_secrets.innerHTML +
            '<p><a href="https://github.com/keymemo/keymemo.github.io/commits/master" target="_blank" class="link_external">Recent changes (commits).</a></p>';
    }
}

// считываем содержимое файла
app.webdavInitialize = function () {
    // инициализируем
    let client = new davlib.DavClient();
    client.initialize(localStorage['webdavServer'],
        localStorage['webdavServerPort'],
        localStorage['webdavServerProtocol'],
        localStorage['webdavLogin'],
        localStorage['webdavPassword']);
    app.webdavPathFolder = localStorage['webdavPathFolder'];
    return client;
}
// проверка подключения к webdav серверу
app.WebDavTestConnection = function () {
    function alertContent(status, statusstring, content) {
        if (status != 207) {
            document.getElementById('webdavTestResult').value = statusstring + ' ' + app.webdavPathFolder;
        } else {
            document.getElementById('webdavTestResult').value = 'Connection established.';
            document.getElementById('WebDavApplyAndReload_a').classList.add('button_active');
            document.getElementById('WebDavApplyAndReload_a').classList.remove('button_not_active');

        }
    }
    // инициализируем
    let client = new davlib.DavClient();
    client.initialize(document.getElementById('webdavServer').value,
        document.getElementById('webdavServerPort').value,
        document.getElementById('webdavServerProtocol').value,
        document.getElementById('webdavLogin').value,
        document.getElementById('webdavPassword').value);
    // нормализуем имя папки 
    let webdavPathFolder = document.getElementById('webdavPathFolder');
    if (webdavPathFolder.value[0] != '/') {
        webdavPathFolder.value = '/' + webdavPathFolder.value;
    }
    let length = webdavPathFolder.value.length;
    if (webdavPathFolder.value[length - 1] != '/') {
        webdavPathFolder.value = webdavPathFolder.value + '/';
    }
    app.webdavPathFolder = webdavPathFolder.value;
//    client.PROPFIND(document.getElementById('webdavPathFolder').value, alertContent, this, 1);
    client.PROPFIND(webdavPathFolder.value, alertContent, this, 1);
}
// сохранить настройки WebDav и перезагрузить страницу
app.WebDavApplyAndReload = function () {
    localStorage['webdavLogin'] = document.getElementById('webdavLogin').value;
    localStorage['webdavPassword'] = document.getElementById('webdavPassword').value;
    localStorage['webdavServer'] = document.getElementById('webdavServer').value;
    localStorage['webdavServerPort'] = document.getElementById('webdavServerPort').value;
    localStorage['webdavServerProtocol'] = document.getElementById('webdavServerProtocol').value;
    localStorage['webdavPathFolder'] = document.getElementById('webdavPathFolder').value;
    window.location.reload();
}

// настройки webdav
app.SetSettingsWebDav = function () {
    'use strict';
    if (localStorage['webdavLogin']) {
        document.getElementById('webdavLogin').value = localStorage['webdavLogin'];
    }
    if (localStorage['webdavPassword']) {
        document.getElementById('webdavPassword').value = localStorage['webdavPassword'];
    }
    if (localStorage['webdavServer']) {
        document.getElementById('webdavServer').value = localStorage['webdavServer'];
    }
    if (localStorage['webdavServerPort']) {
        document.getElementById('webdavServerPort').value = localStorage['webdavServerPort'];
    }
    if (localStorage['webdavServerProtocol']) {
        document.getElementById('webdavServerProtocol').value = localStorage['webdavServerProtocol'];
    }
    if (localStorage['webdavPathFolder']) {
        document.getElementById('webdavPathFolder').value = localStorage['webdavPathFolder'];
    }
    div_show_id('div_settingsWebDav');

}
// состояние 0 - старт программы, загрузка, если возможно, последней версии секретов с сервера webdav
// иначе создание секретов с нуля и настройка параметров
app.state0 = function () {
    'use strict';
    app.spinner_save_show("Load");
    title_state.state0();


    // если запуск с локального диска - работаем офлайн
    if (app.start_from_local_disk) {
        app.debugLog('state0 - Start from local disk.');
        app.local_login(app.state1);
    } else {
        app.debugLog('state0 - Start non from local disk.');

        // нет настроек webdav - спрашиваем настройки и Reload
        if (!localStorage['webdavServer']) {
            app.debugLog('state0 - webdav settings in localStorage NOT exists');
            app.SetSettingsWebDav();
        } else { // настройки есть
            app.debugLog('state0 - webdav settings in localStorage exists');
            // загружаем 
            app.load_div_list_secrets_from_localStorage();
            if (navigator.onLine) { // доступ к сети есть

                // дата сохранения секретов из localStorage
                //            let dateSecretslocalStorage = app.dateListSecretsOnLocalStorage();

                // ищем самый новый файл из папки 
                function getFileNameNewest(handler) {
                    var wrapped = function (status, statusstr, content) {
                        // multistatus request
                        if (content && status == 207) {

                            var parser, doc = null;
                            if (window.DOMParser) {
                                parser = new DOMParser();
                                doc = parser.parseFromString(string.deentitize(content), "application/xml");
                            } else { // Internet Explorer :-)
                                doc = new ActiveXObject("Microsoft.XMLDOM");
                                doc.loadXML(content);
                            }

                            // возврат имени файла самого нового по дате создания
                            function NameNewCreationDate(content) {
                                // отбор только файлов по маске и самый новый файл по дате создания
                                let doc = new DOMParser().parseFromString(content, "application/xml");
                                let fileNameElements = doc.getElementsByTagName('d:displayname');
                                let fileCreationDateElements = doc.getElementsByTagName('d:creationdate');
                                //                        var fileName = [];
                                //                        var fileCreationDate = [];
                                let fileName = "";
                                let fileCreationDate = "0";
                                let regexp = new RegExp(app.fileNameMask + '.+');
                                //                        app.debugLog('state0 - regexp: ' + regexp);
                                for (let i = 0; i < fileNameElements.length; i++) {
                                    let name = fileNameElements[i].textContent;
                                    // app.debugLog('state0 - name: ' + name);
                                    // app.debugLog('state0 - name.search(regexp): ' + name.search(regexp));
                                    if (name.search(regexp) != -1) {
                                        let newCreationDate = fileCreationDateElements[i].textContent;
                                        if (newCreationDate > fileCreationDate) {
                                            fileName = name;
                                            fileCreationDate = newCreationDate;
                                            // app.debugLog('state0         - ADD fileName: ' + fileName + ' fileCreationDate:' + fileCreationDate);
                                        }
                                    }
                                }
                                app.debugLog('state0 - fileName: ' + fileName + '. fileCreationDate:' + fileCreationDate);
                                return fileName;
                            }

                            handler(NameNewCreationDate(content));
                        };
                    };

                    return wrapped;
                };

                let client = app.webdavInitialize();
                client.PROPFIND(app.webdavPathFolder, getFileNameNewest(load_secrets), this, 1);

                // загрузка секретов из самого нового файла
                function load_secrets(fileName) {
                    function wrapContinueHandler(handler) {
                        var wrapped = function (status, statusstr, content) {
                            handler(content);
                        };
                        return wrapped;
                    };

                    let client = app.webdavInitialize();
                    client.GET(app.webdavPathFolder + fileName, wrapContinueHandler(callback));

                    app.debugLog('state0 - load_secrets from:' + fileName);
                }

                function callback(fileContents) {
                    let dateListSecretsOnServer = app.dateListSecretsOnServer(fileContents);
                    if (dateListSecretsOnServer > app.dateListSecretsOnLocalStorage()) {
                        // на сервере webdav новее                    
                        let string = 'The data secrets is fresh (' + dateListSecretsOnServer + ') on Webdav server.\n\rDownload and save local?'
                        if (window.confirm(string)) {
                            let SecretsFileWebdav = app.get_list_secrets_from_html(fileContents);
                            app.div_list_secrets().innerHTML = SecretsFileWebdav.innerHTML;
                            copy_div_attributes(SecretsFileWebdav, app.div_list_secrets());
                            app.need_save();
                            app.logout();
                        }
                    }
                    app.online_offline.innerHTML = 'Synchronized';
                    app.state1();
                }
            } else {
                app.debugLog('state0 - without Internet');
                app.online_offline.innerHTML = 'LocalStorage';
                app.state1();
            }
        }
    }
}
// дата listSecrets в файле по содержимому
app.dateListSecretsOnServer = function (contentsIndexHtml) {
    let SecretsFileWebdav = app.get_list_secrets_from_html(contentsIndexHtml);
    let dateSecretsFileWebdav = SecretsFileWebdav.getAttribute('data-lastchange');
    app.debugLog('dateListSecretsOnServer: ' + dateSecretsFileWebdav);
    return dateSecretsFileWebdav;
}

// дата listSecrets в localStorage
app.dateListSecretsOnLocalStorage = function () {
    // дата сохранения секретов из localStorage
    let dateSecretslocalStorage;
    if (localStorage['list_secrets']) {
        dateSecretslocalStorage = app.get_date_change_list_secret();
    } else {
        dateSecretslocalStorage = "1970-00-00_00:00:01(UTC)";
    }
    app.debugLog('dateListSecretsOnLocalStorage: ' + dateSecretslocalStorage);
    return dateSecretslocalStorage;
}



// разбираем загруженный html файл
// на входе - содержимое файла
// на выходе div с секретами
app.get_list_secrets_from_html = function (fileContents) {
    let wrap = document.createElement('div');
    wrap.id = 'need_remove';

    let contents = document.createElement('html');
    contents.innerHTML = fileContents;

    // body импорта
    let body_import = document.createElement('body');
    body_import.id = 'need_remove';
    body_import.innerHTML = contents.getElementsByTagName('body')[0].innerHTML;
    wrap.appendChild(body_import);
    document.head.appendChild(wrap);

    // секреты из файла
    let import_secrets = document.getElementById('div_list_secrets');
    // удаляем
    wrap.remove();

    return (import_secrets);
}
// состояние 1
// место хранения есть
app.state1 = function () {
    'use strict';
    app.debugLog('state1 - Start.');
    app.spinner_save_show("...Load...");
    title_state.state1();
    header_input.focus();
    app.show_last_change_list_secrets();
    app.debugLog('state1 - Stop.');
    app.spinner_save_none();
}

/**
 * Третий этап - подготовка и работа
 */
app.state2 = function () {
    'use strict';
    app.debugLog('state2 - Start.');
    title_state.state2();

    app.select_secrets_and_control_elements.style.display = 'block';
    // показываем список секретов
    app.recreate_view_secrets();
    div_show_id('select_secrets_and_control_elements');
    header_input.focus();
    timer_autosave_in.init();
    app.online_offline.onclick = app.logout;
    app.online_offline.innerHTML = 'Logout';
    app.debugLog('state2 - Stop.');
}

// расшифровываем, возвращает расшфрованное значение
app.decrypt = function decrypt(value, passPhrase) {
    'use strict';

    if (value !== '') {
        passPhrase = passPhrase || app.passPhrase;
        try {
            var decrypted_string = CryptoJS.AES.decrypt(value, passPhrase).toString(CryptoJS.enc.Utf8);
        } catch (err) {
            decrypted_string = 'Error decrypting.';
            // console.log('Расшифровать не удалось. Неверный passphrase??? "' + value + '"');
        }
    }
    if (decrypted_string === '') {
        decrypted_string = 'Error decrypting.';
    }
    return decrypted_string;
};

/**
 * Зашифровать значение и вернуть шифрованную строку
 * @param   {string} value нешифрованное значение
 * @returns {string} шифрованное значение
 */
app.encrypt = function (value, passPhrase) {
    'use strict';
    passPhrase = passPhrase || app.passPhrase;
    let encrypted_string = '';

    if (undefined !== value) {
        try {
            encrypted_string = CryptoJS.AES.encrypt(value.toString(), passPhrase);
        } catch (err) {
            encrypted_string = '';
            console.log('Зашифровать не удалось. Непечатные символы??? "' + value + '"');
        }
    }
    return encrypted_string;
};


/**
 * вернуть div из дочерних у которого заданный атрибут "data-*" равен value, или первый если value не задан
 * @param   {<div>}   div       - <div> в котором ищем потомков
 * @param   {[[Type]]} data_attr - bvz атрибут вида "data-*"
 * @param   {[[Type]]} value     - значение атрибута
 * @returns {string}   - <div> или 'not defined'
 */
function get_child_div(div, data_attr, value) {
    'use strict';
    // если значение атрибута не задано - возвращаем первый
    if (undefined === value) {
        //        return div.children[0].getAttribute(data_attr);
        return div.children[0];
    }

    let children = div.children;
    let i = 0;
    for (i = 0; i < children.length; i++) {
        if (children[i]) {
            let attr = children[i].getAttribute(data_attr);
            if (attr === value) {
                return children[i];
            }
        }
    }
    //    return 'not defined';
    return app.encrypt('not defined');
}


/**
 * Возвращает div записи содержащей SecretName - атрибут data-name='SecretName'
 * @param   {div} current_element - секрет в котором ищем SecretName
 * @returns {string} значение SecretName из переданного div
 */
function get_name_secret(current_element) {
    'use strict';
    return get_child_div(current_element, 'data-name', 'SecretName');
}


/**
 * скрыть <div>
 * @param {div} div - 'div' элемента для сокрытия
 */
function div_hide(div) {
    'use strict';
    div.style.display = 'none';
}

/**
 * скрыть <div>
 * @param {'id'} iid - 'id' элемента для сокрытия
 */
function div_hide_id(id) {
    'use strict';
    let e = document.getElementById(id);
    div_hide(e);
}


/**
 * показать <div>
 * @param {div} div - 'div' элемента для показа
 */
function div_show(div) {
    'use strict';
    div.style.display = 'block';
}

/**
 * показать <div>
 * @param {string} id - 'id' элемента для показа
 */
function div_show_id(id) {
    'use strict';
    div_show(document.getElementById(id));
}

/**
 * очистить div от children
 * @param {id div} div_ID - очистить div от children
 */
function clear_div(div_ID) {
    'use strict';
    let div = document.getElementById(div_ID);
    if (div) {
        div.innerHTML = '';
    }
}


/**
 * Возвращает <div> по ID <div>'а
 * @param   {[[Type]]} div_ID [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
function get_div_byId(div_ID) {
    'use strict';
    return document.getElementById(div_ID);
}


/**
 * Обновить список серетов
 */
function refresh_div_list_secrets() {
    'use strict';
    app.recreate_view_secrets();
    app.search_header_input();
}


/**
 * сортировка секретов по имени секрета
 * @param   {<div>} div1 - первый div
 * @param   {<div>} div2 - второй div
 * @returns {boolean}  - если первый > второго возвращаем true
 */
function compareSecrets(div1, div2) {
    'use strict';
    let SecretName1 = app.decrypt(get_name_secret(div1).innerHTML);
    let SecretName2 = app.decrypt(get_name_secret(div2).innerHTML);
    if (SecretName1 > SecretName2) {
        return true;
    } else {
        return false;
    }
}

// сортировка одного дива в уже отсортированном списке div'ов
// входящие - номер div
app.sorting_one_div = function (div_number) {
    'use strict';

    // количество секретов
    let len_div_div_list_secrets = app.div_list_secrets().childElementCount;

    let i, new_i = div_number;

    let div = app.div_list_secrets().children[div_number];

    for (i = 0; i < len_div_div_list_secrets; i++) {
        if (i !== div_number) {
            let current_div = app.div_list_secrets().children[i];
            if (compareSecrets(current_div, div)) {
                new_i = i;
                break;
            }
        }
    }
    if (new_i !== div_number) {
        app.div_list_secrets().insertBefore(div, app.div_list_secrets().children[new_i]);
    }
    return new_i;
};

function insertAfter(elem, refElem) {
    'use strict';
    return refElem.parentNode.insertBefore(elem, refElem.nextSibling);
}

// перемещаем div1 перед div2
function move_to_before(div1, div2) {
    'use strict';
    // вставляем elem перед refElem
    div2.parentNode.insertBefore(div1, div2);
}


/**
 * новое поле в секрете
 * @param   {string}- дополнительное поле} data_type - определяет тип поля
 * @param   {string} - имя дополнительного поля} data_name определяет имя доп.поля
 * @param   {string} value     - значение поля
 * @returns {div} новую запись(div) в секрете
 */
function new_field_secret(data_type, data_name, value) {
    'use strict';
    let div = document.createElement('div');
    let innerHTML = '';
    div.setAttribute('data-type', data_type);
    div.setAttribute('data-name', data_name);
    innerHTML = app.encrypt(value);
    div.innerHTML = innerHTML;
    return div;
}


function import_secret_from_keymemo_com(
    SName,
    STags,
    SLink,
    SLogin,
    SPass,
    EBody) {
    'use strict';


    console.log('SName:' + SName +
        '  STags:' + STags +
        '  SLink:' + SLink +
        '  SLogin:' + (SLogin) +
        '  SPass:' + (SPass) +
        '  EBody:' + (EBody) + '<br>');
    // новый секрет
    let new_secret = document.createElement('div');
    // имя секрета не пустое
    if (app.encrypt(SName) !== '') {
        new_secret.appendChild(new_field_secret('field', 'SecretName', SName));
        new_secret.appendChild(new_field_secret('field', 'Login', SLogin));
        new_secret.appendChild(new_field_secret('password', 'Password', SPass));
        new_secret.appendChild(new_field_secret('field', 'Tags', STags));
        new_secret.appendChild(new_field_secret('link', 'Link', SLink));
        new_secret.appendChild(new_field_secret('textarea', 'Notes', EBody));
        // дата изменения
        app.last_change_set(new_secret);
        return new_secret;
    } else {
        return new_secret;
    }
}


/**
 * Меняем passphrase на новую
 */
app.changePassPhrase = function () {
    'use strict';
    let new_list_secret = app.div_list_secrets().cloneNode(true);
    let new_passPhrase = document.getElementById('new_passphrase_input').value;
    let i = 0,
        j = 0;

    for (; i < app.div_list_secrets().childElementCount; i++) {
        // текущий секрет-источник
        let secret = app.div_list_secrets().children[i];
        let new_secret = new_list_secret.children[i];

        for (j = 0; j < app.div_list_secrets().children[i].childElementCount; j++) {
            let decrypt_secret = app.decrypt(secret.children[j].innerHTML);
            if (typeof decrypt_secret !== "undefined") {
                new_secret.children[j].innerHTML = app.encrypt(decrypt_secret, new_passPhrase);
            } else {
                new_secret.children[j].innerHTML = '';
            }
        }
    }

    app.div_list_secrets().innerHTML = new_list_secret.innerHTML;
    localStorage['welcome_phrase'] = app.encrypt(app.welcome_phrase_element.innerHTML, new_passPhrase);

    app.need_save();
    app.logout();
}

/**
 * Меняем welcome_phrase на новую
 */
app.change_welcome_phrase = function () {
    'use strict';
    // если длина новой welcome_phrase равна нулю - то по умолчанию
    if (app.new_welcome_phrase_element.value == "") {
        app.new_welcome_phrase_element.value = "KeyMemo.NEXT";
    }
    // если фраза изменилась
    if (app.welcome_phrase_element.innerHTML != app.new_welcome_phrase_element.value) {
        app.welcome_phrase_element.innerHTML = app.new_welcome_phrase_element.value;
        localStorage['welcome_phrase'] = app.encrypt(app.welcome_phrase_element.innerHTML);
    }
    div_hide(app.div_settings);
}


/**
 * Читаем импортируемый файл и запускаем функцию с прочитанным содержимым
 */
app.select_file_import = function (event, callback) {
    div_hide(app.div_settings);
    let control = event.currentTarget;
    setTimeout(function () {
        progress_bar.init('Loading...');

        // Проверяем поддержку File API
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            alert('File API не поддерживается данным браузером');
        } else {

            // Когда происходит изменение элементов управления, значит появились новые файлы
            let files = control.files[0];

            if (!files || files.name === "") {
                return;
            }
            console.log('Filename: ' + files.name);
            progress_bar.log('<br>Filename: ' + files.name + "<BR>" +
                'Type: ' + files.type + "<BR>" +
                'Size: ' + files.size + ' bytes');
            console.log('Type: ' + files.type);
            console.log('Size: ' + files.size + ' bytes');

            let fr = new FileReader();
            fr.onerror = function (event) {
                console.error('Файл не может быть прочитан! код ' + event.target.error.code);
                progress_bar.log('<br>Файл не может быть прочитан! код ' + event.target.error.code);
            };

            fr.onload = function () {
                let fileContents = this.result;
                // импорт секретов
                callback(fileContents);
            };

            fr.readAsText(files);
        }
        progress_bar.hide();
    }, 100);

};


var progress_bar = pb();
/**
 * Прочитанный файл разбираем как файл из keymemo.com
 * @param {string} fileContents - содержимое импортируемого файла
 */
app.include_js_keymemo_com = function (fileContents) {
    'use strict';
    // из файла берем скрипты и содержимое body
    let contents = document.createElement('html');
    setTimeout(function () {
        progress_bar.init('Import.');

        let wrap = document.createElement('div');
        wrap.id = 'need_remove';

        contents.innerHTML = fileContents;

        // body импорта
        let body_import = document.createElement('body');
        body_import.id = 'need_remove';
        body_import.innerHTML = contents.getElementsByTagName('body')[0].innerHTML;
        wrap.appendChild(body_import);

        // head импорта
        let head_import = document.createElement('head');
        head_import.id = 'need_remove';
        head_import.innerHTML = contents.getElementsByTagName('head')[0].innerHTML;
        wrap.appendChild(head_import);

        document.head.appendChild(wrap);
        progress_bar.log('<br>File load.');

        function remove_need_delete() {
            body_import.innerHTML = '';
            head_import.innerHTML = '';
            wrap.innerHTML = '';

            while (document.getElementById('need_remove')) {
                let rm = document.getElementById('need_remove');
                rm.parentNode.removeChild(rm);
            }
        }
        // создаем элемент со страницей
        let elem = document.createElement('html');
        elem.innerHTML = fileContents;

        // извлекаем все скрипты из файла
        let import_keymemo_com = document.createElement('div');
        import_keymemo_com.id = 'need_deleted';
        let scripts_elem = elem.querySelectorAll('script');
        // собираем все скрипты из файла в import_keymemo_com
        for (let i = 0; i < scripts_elem.length; i++) {
            let js = document.createElement('script');
            js.setAttribute('type', 'text/javascript');
            if (i > 0) {
                js.innerHTML = scripts_elem[i - 1].innerHTML + scripts_elem[i].innerHTML;
            } else {
                js.innerHTML = scripts_elem[i].innerHTML;
            }
            import_keymemo_com.appendChild(js);
        }


        body_import.appendChild(import_keymemo_com);
        if (typeof (Auth) === 'function' && document.getElementById('timelogout')) {

            //заменяем значения полей логина и пароля
            document.getElementById('inputlogin').value = document.getElementById('import_from_keymemo_com_login').value;
            document.getElementById('inputpassword').value = document.getElementById('import_from_keymemo_com_password').value;

            // расшифровываем через функцию keymemo.com из файла
            Auth();

            // импортируем
            let quantity = 0; // количество секретов посчитаем
            let secret_from_keymemo_com = {};
            // сначала собирем все в
            let fragment = document.createDocumentFragment();
            // переберем все расшифрованные поля из keymemo.com
            for (i in SName) {
                //проверка на возможность шифрования (бывают непечатные символы, которые невозможно зашифровать)
                const not_specified = '--not specified--';
                if (app.encrypt(SName[i]) !== '') {
                    secret_from_keymemo_com = import_secret_from_keymemo_com(
                        SName[i],
                        STags[i],
                        SLink[i],
                        SLogin[i],
                        SPass[i],
                        Decode(EBody[i])
                    );

                    if (secret_from_keymemo_com !== []) {
                        fragment.appendChild(secret_from_keymemo_com);
                    }
                    quantity++;
                    //console.log('Импорт секрета N:' + quantity + ' name:' + SName[i]);
                }
            }
            clearInterval(Timer);
            console.log('Всего ' + quantity + ' секретов.');
            progress_bar.log('<br>All ' + quantity + ' secrets.');
            // дата последнего изменения секретов
            app.last_change_set(app.div_list_secrets());

            app.div_list_secrets().appendChild(fragment);
            setTimeout(function () {
                app.sorting_secrets_abc();
            }, 3500);
            remove_need_delete();
        } else {
            remove_need_delete();
            progress_bar.log('<br>No secrets found.');
        }

        progress_bar.hide();
    }, 3000);
}
/**
 * Прочитанный файл разбираем как файл из keymemo.org
 * @param {string} fileContents - содержимое импортируемого файла
 */
app.include_secret_from_keymemo_org = function (fileContents) {
    'use strict';

    div_hide(app.div_settings);
    //  import_passPhrase
    let import_passPhrase = document.getElementById('import_from_keymemo_org_passphrase_input').value;

    let wrap = document.createElement('div');
    wrap.id = 'import_keymemo_org';
    document.head.appendChild(wrap);

    // создаем элемент со страницей
    wrap.innerHTML = fileContents;

    // секреты из файла
    let import_secrets = document.getElementById('div_list_secrets');

    let i = 0,
        j = 0;

    for (; i < import_secrets.childElementCount; i++) {
        // текущий секрет-источник
        let secret = import_secrets.children[i];

        // по записям
        for (j = 0; j < secret.childElementCount; j++) {
            let decrypt_secret = app.decrypt(secret.children[j].innerHTML, import_passPhrase);
            secret.children[j].innerHTML = app.encrypt(decrypt_secret, import_passPhrase);
        }

    }
    // удаляем
    wrap.remove();

    app.div_list_secrets().innerHTML = app.div_list_secrets().innerHTML + '\n' + import_secrets.innerHTML;

    // дата последнего изменения секретов
    app.last_change_set(app.div_list_secrets());

    app.sorting_secrets_abc();
    refresh_div_list_secrets();
}

/**
 * при пустой фразе запретить изменение
 */
app.new_passphrase_input_keyup = function () {
    let value = document.getElementById('new_passphrase_input').value || '';
    let apply_btn = document.getElementById('new_passphrase_a');
    if (value.length > 0) {
        apply_btn.classList = 'button_active';
    } else {
        apply_btn.classList = 'button_not_active';
    }
};


/**
 * открыть файл с секретами
 */
function open_file_list_secret() {
    'use strict';
    // Check for the various File API support.
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        alert('The File APIs are not fully supported in this browser.');
    } else {
        //        var files = evt.target.files; // FileList object

        // files is a FileList of File objects. List some properties.
        let output = [];
        let i, f;
        for (i = 0; f = files[i]; i++) {
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate.toLocaleDateString(), '</li>');
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    }
}

// управление прогресс баром
function pb(value) {
    'use strict';
    // сам прогресс-бар
    let waiting_with_the_log = document.getElementById('waiting_with_the_log');
    let count = 0;
    let progress = document.getElementById('progress_bar_fill');
    let logs = document.getElementById('log-files');
    let timerId = 0;
    return {
        init: function (value) {
            if (count === 0 && 0 === timerId) {
                progress.style.width = '0%';
                logs.innerHTML = '';
                //  div_show_id('waiting_with_the_log');
                waiting_with_the_log.style.display = 'block';
            }

            if (0 != timerId) {
                clearTimeout(timerId);
                timerId = 0;
            }

            if (value) {
                this.log(value);
            }
            count++;
        },
        hide: function () {
            if (count !== 0 && 0 != timerId) {
                clearTimeout(timerId);
                timerId = 0;
            }
            count--;
            if (count <= 0) {
                timerId = setTimeout(function () {
                    // div_hide_id('waiting_with_the_log');
                    waiting_with_the_log.style.display = 'none';
                    timerId = 0;
                    count = 0;
                }, 3000);
            } else {


            }
        },
        log: function (value) {
            logs.innerHTML += value;
            logs.scrollTop = logs.scrollHeight;
        },
        logn: function (value) {
            logs.innerHTML += '<br>';
            logs.innerHTML += value;
            logs.scrollTop = logs.scrollHeight;
        },
        value: function (value) {
            progress.style.width = value + '%';
        }
    }
}

// http://stackoverflow.com/questions/23223718/failed-to-execute-btoa-on-window-the-string-to-be-encoded-contains-characte
//кодирование base64 в т.ч. с учетом не latin-1 симоволов
String.prototype.b64encode = function () {
    return btoa(unescape(encodeURIComponent(this)));
};
String.prototype.b64decode = function () {
    return decodeURIComponent(escape(atob(this)));
};

function show_span(value) {
    var span = document.getElementById('span-google-test');
    span.innerHTML = span.innerHTML + value + "<br>";
}


// формируем файл для экспорта
app.construct_HTML_page_for_export = function () {
    'use strict';

    // скачиваем файл
    function dowloadFile(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, false); // `false` makes the request synchronous
        try {
            request.send(null);
            if (request.status != 200) {
                alert(`Ошибка ${xhr.status}: ${xhr.statusText}`);
            } else {
                return request.responseText;
            }
        } catch (err) { // для отлова ошибок используем конструкцию try...catch вместо onerror
            //                alert("Запрос не удался");
            app.debugLog("Запрос не удался");
        }
    }

    let DocumentFragment = document.createDocumentFragment();
    DocumentFragment = document.cloneNode(true);
    // скачиваем оригинальный index.html
    DocumentFragment.documentElement.innerHTML = dowloadFile('index.html');

    // страница
    let html_page = DocumentFragment.documentElement;

    // секреты для сохранения
    //    let list_secret_saved = DocumentFragment.getElementById('div_list_secrets');
    let list_secret_saved = DocumentFragment.getElementById('div_list_secrets');
    //    DocumentFragment.documentElement.getElementById('div_list_secrets')=app.div_list_secrets();
    list_secret_saved.innerHTML = app.div_list_secrets().innerHTML;
    // удаляем атрибуты из всех элементов
    app.remove_attr_notSaved(list_secret_saved);
    // копируем атрибуты списка
    copy_div_attributes(app.div_list_secrets(), list_secret_saved);

    // собираем js script и заменяем ссылки на содержание
    for (const script of DocumentFragment.scripts) {
        if (script.src && script.src !== '') {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', script.src, false);
            try {
                xhr.send();
                if (xhr.status != 200) {
                    alert(`Ошибка ${xhr.status}: ${xhr.statusText}`);
                } else {
                    script.innerHTML = xhr.response;
                    script.setAttribute('type', 'text/javascript');
                    script.removeAttribute('src');
                }
            } catch (err) { // для отлова ошибок используем конструкцию try...catch вместо onerror
                //                alert("Запрос не удался");
                app.debugLog("Запрос не удался");
            }
        }
    }


    let head = DocumentFragment.getElementsByTagName('head')[0];
    // заменяем ссылку на css на содержание
    let links_on_css = DocumentFragment.getElementsByTagName('link');

    for (let i = 0; i < links_on_css.length; i++) {
        let link = links_on_css[i];
        if (link.href && link.href !== '' && link.type === 'text/css') {
            let css = document.createElement('style');
            css.type = 'text/css'
            css.innerHTML = dowloadFile(link.href);
            head.appendChild(css);

            links_on_css[i].remove();
        }
    }
    //    return '<!DOCTYPE html>' + '\n' + html_page.outerHTML;
    return html_page.outerHTML;
}

// видим ли элемент?
app.element_is_visible = function (el) {
    let rect = el.getBoundingClientRect();
    let elemTop = rect.top;
    let elemBottom = rect.bottom;

    // Only completely visible elements return true:
    let isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
}

/**
 * обновляем 'view_secrets' в соответствии с 'div_list_secrets'
 * @returns {[[Type]]} [[Description]]
 */
app.recreate_view_secrets = function () {
    'use strict';

    let i = 0;
    // сначала собираем ссылки в
    let fragment = document.createDocumentFragment();
    let len_div_list_secrets = app.div_list_secrets().childElementCount;

    // передается div с секретом
    // создает ссылку на секрет и возращает div
    function create_link_on_secret(div_source_secret) {
        let wrap_field = document.createElement('div');
        let i = 0,
            j = 0;
        wrap_field.className = 'list_on_secret';
        if (div_source_secret.getAttribute('data-notsaved') === 'true') {
            wrap_field.classList.add('secret_not_saved');
        }

        // ссылка на секрет
        let a = document.createElement('a');

        wrap_field.appendChild(a);
        a.innerHTML = app.decrypt(get_child_div(div_source_secret, 'data-name').innerHTML);
        a.className = 'link_on_secret';

        // обрабочик click
        a.addEventListener('click',
            function () {
                // редактируем секрет полностью
                app.edit_secret(div_source_secret, this);
            });
        // событие для поиска внутри зашифрованных полей
        a.addEventListener('search_in', function (e) {

            function a_show(a) {
                const classList = a.classList;
                if (app.element_is_visible(a)) {
                    setTimeout(function () {
                        classList.remove('hideBlock_beautifully', 'hideBlock_immediately');
                    }, app.timeout_search_animation);
                } else {
                    classList.remove('hideBlock_beautifully', 'hideBlock_immediately');
                }
            }

            function a_hide(a) {
                const classList = a.classList;
                // если элемент видим
                if (app.element_is_visible(a)) {
                    setTimeout(function () {
                        classList.add('hideBlock_beautifully');
                    }, app.timeout_search_animation);
                } else {
                    classList.add('hideBlock_immediately');
                }

            }
            //console.info("Event is: ", e);
            //console.info("Custom data is: ", e.detail);
            let isFound;
            let Is
            let array_word = e.detail.array_word;
            if (div_source_secret && array_word.length > 0) {
                let children = div_source_secret.children;
                // проверяем наличие каждого слова
                for (i = 0; i < array_word.length; i++) {
                    isFound = false;
                    // по полям секрета
                    for (j = 0; j < children.length; j++) {
                        if (app.IsArchive(div_source_secret) === app.Is_button_view_archive()) {
                            // текущее поле расшифровываем
                            let current_field = children[j].innerHTML;
                            if (current_field !== '') {
                                let innerHTML = app.decrypt(current_field);

                                // экранируем символы
                                function escape(value) {
                                    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&")
                                };

                                let array_word_escape = escape(array_word[i]);
                                // console.log('  array_word_escape->' + array_word_escape);

                                if (innerHTML.toLowerCase().match(array_word_escape)) {
                                    //console.log('    частичное совпадение, слово ' + i + ' ->' + array_word[i] + ' поле->' + innerHTML);
                                    isFound = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!isFound) {
                        // не было найдено текущее слово - не продолжаем
                        break;
                    }
                }
                if (isFound) {
                    a_show(a);
                } else {
                    a_hide(a);
                }
            }
        });
        return wrap_field;
    }

    let IsButton_view_archive = get_div_byId('button_view_archive').getAttribute('archive');
    let link;


    /////////////////
    function link_show(a) {
        const classList = a.classList;
        if (app.element_is_visible(a)) {
            setTimeout(function () {
                classList.remove('hidelink_beautifully');
            }, app.timeout_search_animation);
        } else {
            classList.remove('hidelink_beautifully');
        }
    }

    function link_hide(a) {
        const classList = a.classList;
        // если элемент видим
        if (app.element_is_visible(a)) {
            setTimeout(function () {
                classList.add('hidelink_beautifully');
            }, app.timeout_search_animation);
        } else {
            classList.add('hidelink_beautifully');
        }
    }
    //////////////////



    // массив ссылок на секреты
    for (i = 0; i < len_div_list_secrets; i++) {
        // текущий секрет-источник
        let this_secret = app.div_list_secrets().children[i];
        let IsSecret_in_archive = this_secret.getAttribute('archive');

        // ссылка на секрет
        link = create_link_on_secret(this_secret);
        // если список "Архивный"
        if (IsButton_view_archive) {
            if (IsSecret_in_archive) {
                link_show(link.children[0]);
            } else {
                link_hide(link.children[0]);
            }
        } else {
            if (IsSecret_in_archive) {
                link_hide(link.children[0]);
            } else {
                link_show(link.children[0]);
            }
        }
        // добавляем
        fragment.appendChild(link);
    }

    // дата последнего изменения списка секретов
    app.show_last_change_list_secrets();

    app.clear_view_secrets();
    app.div_view_secrets.appendChild(fragment);
};

/**
 * Возвращает текущую дату и время в формате "YYYY-MM-DD HH:MM:SS"
 * @returns {string} - строка с датой/временем
 */
app.data_now = function () {
    'use strict';
    let today = new Date(); // сегодняшняя дата и время
    let curYear = today.getUTCFullYear();
    let curMonth = today.getUTCMonth() + 1;
    if (curMonth < 10) {
        curMonth = '0' + curMonth;
    }
    let curDay = today.getUTCDate();
    if (curDay < 10) {
        curDay = '0' + curDay;
    }
    let curHour = today.getUTCHours();
    if (curHour < 10) {
        curHour = '0' + curHour;
    }
    let curMinute = today.getUTCMinutes();
    if (curMinute < 10) {
        curMinute = '0' + curMinute;
    }
    let curSeconds = today.getUTCSeconds();
    if (curSeconds < 10) {
        curSeconds = '0' + curSeconds;
    }

    // в формате "YYYY-MM-DD_HH:MM:SS(UTC)"
    let date_now = curYear + '-' + curMonth + '-' + curDay + '_' + curHour + ':' + curMinute + ':' + curSeconds + '(UTC)';
    return date_now;
};

// формируем из формата "YYYY-MM-DD_HH:MM:SS(UTC)"
// на входе дата в формате "YYYY-MM-DD_HH:MM:SS(UTC)"
// на выходе значение типа Date
app.data_getTime = function (data) {
    // формируем время в формате "YYYY-MM-DD_HH:MM:SS(UTC)" из полученного
    let Year = data.substr(0, 4);
    let Month = data.substr(5, 2);
    let Day = data.substr(8, 2);
    let Hour = data.substr(11, 2);
    let Minute = data.substr(14, 2);
    let Seconds = data.substr(17, 2);

    // делим дату и время
    let datas = data.split('_');
    // выделяем время
    let date = datas[0].split('-');
    // выделяем дату
    let time = datas[1].split('(')[0].split(':');

    var data = new Date();
    data.setUTCFullYear(date[0], date[1] - 1, date[2]);
    data.setUTCHours(+time[0], time[1], +time[2]);

    return data; // в формате "YYYY-MM-DD_HH:MM:SS(UTC)"
}

app.now = function () {
    // текущая дата
    let now = new Date();
    return now;
}
// возвращает текстом разницу между текущим временем и переданным.
app.data_difference = function (data) {

    let data_diff = (app.now().getTime() - app.data_getTime(data).getTime()) / 1000;

    // более года 60*60*24*365
    if (data_diff > 31536000) {
        return "Over a year ago"
    }

    // более полугода 60*60*24*183
    if (data_diff > 15811200) {
        return "More than half a year ago"
    }

    // более месяца 60*60*24*30
    if (data_diff > 2592000) {
        return (parseInt(data_diff / 2592000) + " months ago");
    }

    // более двух недель 60*60*24*14
    if (data_diff > 1209600) {
        return "Over 2 weeks"
    }

    // более недели 60*60*24*7
    if (data_diff > 604800) {
        return "More than 1 week"
    }

    // 2 дня назад 60*60*24*2
    if (data_diff > 172800) {
        return (parseInt(data_diff / 86400) + " days ago");
    }

    // 1 день назад 60*60*24*1
    if (data_diff > 86400) {
        return "Yesterday"
    }

    // 1 час назад 60*60
    if (data_diff > 3600) {
        return (parseInt(data_diff / 3600) + " hours ago");
    }

    // полчаса назад 60*30
    if (data_diff > 1800) {
        return "Half an hour ago"
    }

    // несколько минут назад 60*2
    if (data_diff > 120) {
        return (parseInt(data_diff / 60) + " minutes ago");
    }

    // несколько минут назад 60
    if (data_diff > 60) {
        return (parseInt(data_diff / 60) + " minute ago");
    }

    // время сохранения в будущем
    if (data_diff < 0) {
        return ("Date from the future");
    }

    // несколько секунд назад
    return (parseInt(data_diff) + " seconds ago");

}

// секрет архивный? - проверяется наличие атрибута 'archive' и его значение 'true'
app.IsArchive = function (div) {
    let archive = div.getAttribute('archive');
    if (archive === 'true') {
        return true;
    } else {
        return false;
    }
}

//app.edit_secret = function (source_div, link_on_secret) {}
/**
 * Выводит выбранный секрет для редактирования
 * @param   {object}   source_div - div с секретом
 * @returns {[[Type]]} [[Description]]
 */
// view_secret
app.edit_secret = function (source_div, link_on_secret) {
    'use strict';
    let need_save_secret = false;

    // если запуск из файла - ничего не делать
    if (app.start_from_local_disk && undefined === source_div) {
        return;
    }

    let i = 0;
    link_on_secret = link_on_secret || undefined;
    app.div_edited_secret.style.display = 'block';
    app.div_edited_secret.classList.remove('hidden_secret');

    // клон для редактирования
    // если без источника - создаем секрет
    if (undefined === source_div) {
        // новый секрет из эталонного
        var intermediate_div = get_div_byId('etalonSecret').cloneNode(true);
        intermediate_div.removeAttribute('id');
        app.last_change_set(intermediate_div);
    } else {
        intermediate_div = source_div.cloneNode(true);
    }

    // высоту textarea устанавливаем такой, чтобы не было скролинга
    function resize_textarea(text_area, min_cols, max_cols) {
        text_area.rows = 0;
        while (text_area.clientHeight < text_area.scrollHeight) {
            text_area.rows++;
            if (text_area.rows > max_cols) {
                break;
            }
        };
        text_area.rows = Math.max(min_cols, text_area.rows);
    }

    // плавный скрол к элементу
    function smooth_scrolling(parent_element, element, time) {
        // scrollTop измеряет дистанцию от верха элемента до верхней точки видимого контента
        // если до результата менее 2 px
        const delta = Math.abs(element.offsetTop - parent_element.scrollTop);
        if (delta < 2) {
            parent_element.scrollTop = element.offsetTop;
        } else {
            //выше или ниже
            const sign = Math.sign(element.offsetTop - parent_element.scrollTop);
            // отслеживаем было ли движение
            const tmp_scrollTop = parent_element.scrollTop;

            parent_element.scrollTop = parent_element.scrollTop + sign * delta / 4;

            if (Math.abs(tmp_scrollTop - parent_element.scrollTop) > 3) {
                clearTimeout(app.timer_smooth_scrolling);
                app.timer_smooth_scrolling = setTimeout(smooth_scrolling, 30, parent_element, element, time);
            }
        }

    }

    // плавный скрол к элементу
    function soft_scroll(element, time) {
        let scrool_to = () => {
            if (element.parentElement) {
                // scrollTop измеряет дистанцию от верха элемента до верхней точки видимого контента
                // если до результата менее 2 px
                const delta = Math.abs(element.offsetTop - element.parentElement.scrollTop);
                if (delta < 3) {
                    element.parentNode.scrollTop = element.offsetTop;
                    clearTimeout(timerId);
                } else {
                    //выше или ниже
                    const sign = Math.sign(element.offsetTop - element.parentNode.scrollTop);
                    // отслеживаем было ли движение
                    const tmp_scrollTop = element.parentNode.scrollTop;
                    element.parentNode.scrollTop = element.parentNode.scrollTop + sign * delta / 4;
                }
            }
        }
        let timerId = setInterval(() => scrool_to(), time);
    }

    // формирует вид записи
    // на входе - div записи-источника
    // возвращает div для view
    function view_field_representation(div) {

        // тип записи
        let type = div.getAttribute('data-type') || 'type';
        let name = div.getAttribute('data-name') || 'name not defined';
        let value = div.innerHTML || '';
        let removable = div.getAttribute('data-removable') || 'false';

        // создаем элемент div - содержит строку с записью - в конце вернем
        let return_div = document.createElement('div');
        return_div.className = 'container';

        let element_del = document.createElement('a'); // "удалить"
        let element_title = document.createElement('a'); // название
        let element_input = {};

        if (type === 'textarea') { // поле ввода
            element_input = document.createElement('textarea');
            element_input.classList.add('textarea_edited_secret');
        } else {
            element_input = document.createElement('input');
        }
        element_input.setAttribute('id', name);
        let wrap_element_input = document.createElement('div'); // обертка для поля ввода
        let element_copy = document.createElement('a'); // "copy"
        element_input.value = value;

        // добавляем в родительский контейнер
        return_div.appendChild(element_del);
        return_div.appendChild(element_title);
        return_div.appendChild(element_copy);
        if (type !== 'textarea') {
            wrap_element_input.appendChild(element_input);
            return_div.appendChild(wrap_element_input);
        } else {
            return_div.appendChild(document.createElement('br'));
            return_div.appendChild(element_input);
        }

        // class'ы
        element_title.className = 'field_title';
        element_input.classList.add('input_focus_off');
        wrap_element_input.className = 'element_input';

        // "удалить"
        if (removable === 'true') {
            return_div.setAttribute('data-removable', 'true');

            if (element_input.value === '') {
                element_del.className = 'remove_active';
            } else {
                element_del.className = 'remove_not_active';
            }
            element_del.innerHTML = '×';
            // удаление записи
            element_del.addEventListener('click',
                function () {
                    if (element_input.value === '') {
                        if (return_div.getAttribute('data-removable') === 'true') {
                            div.remove();
                            return_div.remove();
                        }
                    }
                });
        } else {
            element_del.className = 'remove_not_active';
            return_div.setAttribute('data-removable', 'false');
            element_del.innerHTML = '&nbsp;';
        }

        // название
        if (type === 'link') {
            element_title.innerHTML = name;
            if (element_input.value !== '') {
                element_title.className = 'field_title_link';
            }
            element_title.addEventListener('click',
                function () {
                    element_input.focus();
                    let hpref = element_input.value;
                    element_input.blur();
                    if (hpref !== '') {
                        // если нет http вначале - добавляем
                        if (!(hpref).match('^http.*')) {
                            hpref = 'http://' + hpref;
                        }
                        window.open(hpref);
                    }
                });
        } else if (type === 'password') {
            element_title.innerHTML = name;
            if (element_input.value !== '') {
                element_title.className = 'field_title';
            } else {
                element_title.className = 'field_title_link';
            }
            element_title.addEventListener('click',
                function () {
                    if (element_input.value === '') {
                        // создаем форму для выбора имени, типа формы, можно ли удалить
                        let pass_generate_a = document.getElementById('pass_generate_a');
                        let pass_insert_a = document.getElementById('pass_insert_a');
                        let Password_for_insert = document.getElementById('Password_for_insert');

                        pass_generate_a.onclick = function () {
                            gen_pass();
                            Password_for_insert.focus();
                            Password_for_insert.select();
                        };

                        pass_insert_a.onclick = function () {
                            if (Password_for_insert.value !== '') {
                                div_hide_id('div_password_generate');
                                element_input.focus();
                                element_input.value = Password_for_insert.value;
                                element_input.select();
                            }
                        };
                        div_show_id('div_password_generate');
                        Password_for_insert.focus();
                    }
                });
        } else {
            element_title.innerHTML = name;
        }

        // кнопка скопировать
        element_copy.innerHTML = 'copy';
        if (element_input.value !== '') {
            element_copy.className = 'buton_copy_active';
        } else {
            element_copy.className = 'buton_copy_not_active';
        }
        // копируем содержимое поле ввода по нажатию на Copy
        element_copy.addEventListener('click',
            function () {
                if (element_input.value !== '') {
                    element_input.classList.remove('copied');
                    // сохраняем значение
                    let save_encrypted_value = element_input.value;
                    element_input.focus();
                    document.execCommand('copy');
                    element_input.blur();
                    // восстанавливаем значение
                    element_input.value = save_encrypted_value;
                    element_input.classList.add('copied');
                }
            });

        // отслеживаем изменение значения поля
        let tmp_element_input = '';
        let tmp_element_input_encrypt = '';
        // потеря фокуса
        element_input.addEventListener('blur',
            function () {
                // если значение изменилось
                if (tmp_element_input !== element_input.value) {
                    need_save_secret = true;
                }
                // сохраняем высоту для textarea
                if (type === 'textarea') {
                    div.setAttribute('data-textareaHeight', element_input.style.height)
                }

                this.classList.add('input_focus_off');
                this.classList.remove('input_focus_on');
                if (this.value === '') {
                    // кнопку удаления включаем
                    element_del.className = 'remove_active';
                    // кнопку копирования выключаем
                    element_copy.className = 'buton_copy_not_active';
                    // ссылка
                    if (type === 'link') {
                        element_title.className = 'field_title';
                    }
                    if (type === 'password') {
                        element_title.className = 'field_title_link';
                    }
                    div.innerHTML = this.value;
                } else
                if (app.passPhrase !== '') {
                    div.innerHTML = app.encrypt(this.value);
                    // не шифруем поле 'SecretName' 
                    if (element_input.getAttribute('id') != 'SecretName') {
                        this.value = div.innerHTML;
                    }                    

                    // кнопку удаления выключаем
                    element_del.className = 'remove_not_active';
                    // кнопку копирования включаем
                    element_copy.className = 'buton_copy_active';
                    // ссылка
                    if (type === 'link') {
                        element_title.className = 'field_title_link';
                    }
                    if (type === 'password') {
                        element_title.className = 'field_title';
                    }
                }
            }, false);
        // получение фокуса
        element_input.addEventListener('focus',
            function () {
                let data = div.innerHTML;

                // сохраняем значение encrypt
                tmp_element_input_encrypt = data;

                this.classList.add('input_focus_on');
                this.classList.remove('input_focus_off');
                // если значение не пустое - дешифруем
                if (data !== '') {
                    if (app.passPhrase !== '') {
                        this.value = app.decrypt(data);
                        // сохраняем значение
                        tmp_element_input = this.value;;
                    }
                }

                // высота textarea
                if (type === 'textarea') {
                    resize_textarea(element_input, "2", "40")
                    // скрол на элемент
                    smooth_scrolling(app.div_edited_secret, element_input.parentElement, 2);
                } else {
                    // скрол на элемент
                    smooth_scrolling(app.div_edited_secret, element_input.parentElement.parentElement, 2);
                }
                this.select();

            }, false);

        // ввод символа
        element_input.addEventListener('keyup',
            function () {
                if (this.value !== '') {
                    // console.log('Key code ' + event.keyCode);
                    // Enter
                    if (event.keyCode === 13 && type !== 'textarea') {
                        this.blur();
                    }
                    //keyDown
                    if (event.keyCode === 40 && type !== 'textarea') {
                        this.blur();
                    }
                    //keyUp
                    if (event.keyCode === 38 && type !== 'textarea') {
                        this.blur();
                    }
                }

            }, false);
        return return_div;
    }

    // обновить вывод текущего секрета
    function refresh_view_secret() {

        // скрыть секрет
        function secret_hide() {
            // удаляем промежуточный
            app.div_edited_secret.innerHTML = '';
            app.div_edited_secret.style.display = 'none';
            app.div_edited_secret.classList.add('hidden_secret');
            // отмена выхода по ESC
            document.removeEventListener('keyup', esc_press, false);
        }

        app.div_edited_secret.innerHTML = '';

        let add = document.createElement('a');
        let arc = document.createElement('a');
        let remove = document.createElement('a');
        let save = document.createElement('a');
        let cancel = document.createElement('a');

        // кнопка "добавить запись в секрет"
        add.innerHTML = 'Add field';
        add.className = 'button_active';
        add.setAttribute('id', 'add_field');
        add.addEventListener('click',
            function () {
                // добавляем новую запись в секрет
                let can_be_deleted = document.getElementById('can_be_deleted');
                let add_field_name = document.getElementById('add_field_name');
                let field = document.getElementById('field');
                let link = document.getElementById('link');
                let password = document.getElementById('password');
                let textarea = document.getElementById('textarea');
                let field_insert = document.getElementById('field_insert');


                field_insert.onclick = function () {
                    if (add_field_name.value !== '') {
                        // создаем запись  "по умолчанию" в соответствии с заданными элементами
                        //<div id=etalonSecret_field hidden="" data-type="field" data-name='Tags'></div>
                        let new_field = document.createElement('div');
                        new_field.setAttribute('data-name', add_field_name.value);
                        if (can_be_deleted.checked) {
                            new_field.setAttribute('data-removable', 'true');
                        }
                        if (field.checked) {
                            new_field.setAttribute('data-type', 'field');
                        }
                        if (link.checked) {
                            new_field.setAttribute('data-type', 'link');
                        }
                        if (password.checked) {
                            new_field.setAttribute('data-type', 'password');
                        }
                        if (textarea.checked) {
                            new_field.setAttribute('data-type', 'textarea');
                        }

                        div_hide_id('div_form_add_field');
                        //добавляем в конец
                        intermediate_div.appendChild(new_field);
                        refresh_view_secret();
                    }
                };
                div_show_id('div_form_add_field');
                document.getElementById('add_field_name').focus();
            });
        if (!app.start_from_local_disk) {
            app.div_edited_secret.appendChild(add);
        }

        // кнопка "Признак архивности"        
        if (app.IsArchive(intermediate_div)) {
            arc.innerHTML = 'In current';
        } else {
            arc.innerHTML = 'To archive';
        }
        arc.className = 'button_active';
        arc.setAttribute('id', 'archive');

        arc.addEventListener('click',
            function () {
                // секрет архивный?
                if (app.IsArchive(intermediate_div)) {
                    arc.innerHTML = 'To archive';
                    intermediate_div.removeAttribute('archive');
                    app.secret_archive_state('false');
                } else {
                    arc.innerHTML = 'In current';
                    intermediate_div.setAttribute('archive', 'true');
                    app.secret_archive_state('true');
                }
            });
        if (!app.start_from_local_disk) {
            app.div_edited_secret.appendChild(arc);
        }

        //дата изменения
        let lastChange_secrets = document.createElement('div');
        lastChange_secrets.setAttribute('id', 'lastChange_secrets');

        let lastChange_secret_title = document.createElement('div');
        lastChange_secret_title.classList = "lastChange_secret_title";
        lastChange_secret_title.innerHTML = 'Last change:<br>';
        lastChange_secret_title.appendChild(lastChange_secrets);
        lastChange_secrets.innerHTML = app.data_change_diff_now(app.last_change_get(intermediate_div));

        app.div_edited_secret.appendChild(lastChange_secret_title);

        // добавляем секрет по записям
        let intermediate_children = intermediate_div.children;
        for (i = 0; i < intermediate_children.length; i++) {
            // источник
            let current_field = intermediate_children[i];
            app.div_edited_secret.appendChild(view_field_representation(current_field));
        }

        if (!app.start_from_local_disk) {
            if (undefined !== source_div) {
                // удалить секрет
                remove.innerHTML = 'Remove secret';
                remove.className = 'button_active';
                remove.setAttribute('id', 'remove_secret');
                remove.addEventListener('click',
                    function () {
                        secret_hide();

                        //удаляем исходный секрет
                        source_div.remove();

                        if (link_on_secret) {
                            setTimeout(function () {
                                link_on_secret.parentNode.classList.add('hidden');
                            }, 500);
                        }
                        setTimeout(function () {
                            // удаляемый секрет
                            app.div_edited_secret.innerHTML = '';
                            app.div_edited_secret.style.display = 'none';
                            link_on_secret.parentNode.remove();

                            // необходимо сохратить
                            need_save_secret = true;

                            // обновляем "последнее изменение" списка секретов
                            app.last_change_set(app.div_list_secrets());
                            app.recreate_view_secrets();
                        }, 1000);
                    });
                app.div_edited_secret.appendChild(remove);
            }
        }

        //сохранить секрет
        save.innerHTML = 'Save';
        save.className = 'button_active';
        save.setAttribute('id', 'save_secret');
        save.addEventListener('click',
            function () {
                let SecretName = get_name_secret(intermediate_div);
                if (SecretName.innerHTML !== '') {
                    // удаляем источник секрета
                    if (source_div) {
                        source_div.remove();
                    }
                    // обновляем дату "последнее изменение"
                    app.last_change_set(intermediate_div);

                    // обновляем "последнее изменение" списка секретов
                    app.last_change_set(app.div_list_secrets());

                    // добавляемый текущий
                    secret_hide();
                    app.div_list_secrets().appendChild(intermediate_div);
                    let index = app.sorting_one_div(intermediate_div.parentElement.childElementCount - 1);
                    app.recreate_view_secrets();
                    soft_scroll(app.div_view_secrets.childNodes[index], 100);
                    header_input.focus();

                } else {
                    document.getElementById('SecretName').focus();
                }
            });
        if (!app.start_from_local_disk) {
            app.div_edited_secret.appendChild(save);
        }
        // не сохранять секрет
        cancel.innerHTML = 'Cancel';
        cancel.className = 'button_active';
        cancel.setAttribute('id', 'cancel_secret');
        // отмена изменений
        function cancel_press() {
            secret_hide();
            intermediate_div.innerHTML = '';
            intermediate_div.remove();
        };

        // отслеживаем нажание кнопки ESC
        function esc_press(e) {
            if (e.keyCode === 27) { // Escape
                //                console.log('esc press');
                // убираем фокус с текущего элемента
                document.activeElement.blur();
                // не было изменений - выходим
                if (!need_save_secret) {
                    cancel_press();
                }
            }
        }

        cancel.addEventListener('click', cancel_press);

        // выход по кнопке ESC если не было изменений
        document.addEventListener("keyup", esc_press);
        app.div_edited_secret.appendChild(cancel);
    }

    // освежаем секрет
    refresh_view_secret();
    document.getElementById('SecretName').focus();
};

app.onkeyup = function (event) {
    app.welcome_phrase_element.innerHTML = "";
    // обработка Enter как нажатия на кнопку
    if (event.keyCode === 13) {
        set_passphrase();
    }
}

app.keypress = function (event) {
    function check_layout(e) {
        let key = e.key;
        let capsLockEnabled = e.getModifierState && e.getModifierState('CapsLock');
        let layout = 'non En';
        let RegEx = new RegExp('[\\w\\s]');

        // ловим английские буквы
        if (RegEx.test(key)) {
            layout = 'en';
        }

        // ловим CapsLock
        if (capsLockEnabled) {
            layout = layout + ', ' + 'Caps Lock';
        }

        if (layout) {
            app.keyboardLayout_element.innerHTML = layout;
        }
    };

    check_layout(event);
}
// переключение "Архивные- Не архивные".
app.click_button_view_archive = function () {
    var intermediate_div = get_div_byId('button_view_archive');
    if (intermediate_div.getAttribute('archive') === 'true') {
        app.secret_archive_state('false');
    } else {
        app.secret_archive_state('true');
    }
    app.search_header_input(true);
}
// поиск в соответствии с header_input
app.search_header_input = function (forceExecute) {

    // задержка для вывода/сокрытия "пачками"
    let burst_delay = 100; // 1000=1 сек

    // поиск по всем полям секретов, ненайденные скрываются.
    function find_secrets(forceExecute) {
        'use strict';
        let header_input_value = app.header_input.value;
        //        console.log("NEW search, app.timer_search=", app.timer_search, " header_input.value=", header_input_value);

        // ограничение максимального количества символов для поиска
        const max_chars = 40;
        if (header_input_value.length > max_chars) {
            app.header_input.value = app.header_input.value.substr(0, max_chars);
        }

        //нормализуем входные данные
        let input_value = header_input_value.toLowerCase(); // в нижний регистр
        input_value = input_value.replace(/ {1,}/g, ' '); // убираем двойные пробелы
        input_value = input_value.replace(/^\s*/, ''); // все пробельные символы в начале строки
        input_value = input_value.replace(/\s+$/, ''); // все пробельные символы в конце строки

        // если строка поиска изменилась - ищем
        if ((app.input_value_custom != input_value) || forceExecute) {
            // затемнение
            setTimeout(function () {
                //                app.div_view_secrets.classList.add('now_is_searching');
                //                void app.div_view_secrets.offsetWidth;
                app.spinner_save_show("search...");
            }, 1);

            app.input_value_custom = input_value;

            let view_secrets_children = app.div_view_secrets.children;

            //массив слов для поиска
            let words = input_value.split(' ');

            // в событии передаем массив слов для поиска
            let search_event = new CustomEvent('search_in', {
                detail: {
                    array_word: words
                }
            });

            let currentTime = new Date();
            // по всем секретам с конца
            for (let i = view_secrets_children.length - 1; i >= 0; i--) {
                let now = new Date();
                // если время следующей пачки подошло - назначаем новое время
                if (currentTime.getMilliseconds() + burst_delay <= now.getMilliseconds()) {
                    currentTime = now;
                }
                app.timeout_search_animation = currentTime.getMilliseconds() + burst_delay - now.getMilliseconds();

                // ищем в текущем секрете
                view_secrets_children[i].childNodes[0].dispatchEvent(search_event);
            }

            // снимаем затемнение
            setTimeout(function () {
                app.spinner_save_none();
            }, currentTime.getMilliseconds() + burst_delay * 2 - (new Date()).getMilliseconds());
        }
    }

    clearTimeout(app.timer_search);
    app.timer_search = setTimeout(find_secrets, burst_delay * 5, forceExecute);
};


// true - если вид 'Archive'
app.Is_button_view_archive = function (state) {
    let div = get_div_byId('button_view_archive');
    if (div.innerHTML === 'Archive') {
        return true;
    } else {
        return false;
    }
}

// показ списка - действующий или архивный
app.secret_archive_state = function (state) {
    let div = get_div_byId('button_view_archive');
    if (state === 'true') {
        div.innerHTML = 'Archive';
        div.setAttribute('archive', 'true');
    } else {
        div.innerHTML = 'Current';
        div.removeAttribute('archive');
    }
    refresh_div_list_secrets();
}

/**
 * Устанавливаает значение атрибута 'data-lastChange' в текущую дату текущего секрета и охватюывающего <div>а
 * @param {div} div - <div> где ищется атрибут
 * @returns {string} - значение установленного  атрибута
 */
app.last_change_set = function (div) {
    'use strict';
    app.need_save();
    let date_now = app.data_now();
    // добавляем текущую дату как дату изменения
    div.setAttribute('data-lastChange', date_now);
    // добавляем признак несохраненности
    div.setAttribute('data-notSaved', 'true');
    return date_now;
}


/**
 * возвращает значение атрибута 'data-lastChange'
 * @param {div} div - <div> где ищется атрибут
 * @returns {string} - значение прочитанного атрибута
 */
app.last_change_get = function (div) {
    'use strict';
    return div.getAttribute('data-lastChange') || ' not defined';
};


app.clear_view_secrets = function () {
    'use strict';
    app.div_view_secrets.innerHTML = '';
};


// сохраняем настройки локально в localStorage.
app.save_div_list_secrets_to_localStorage = function () {
    'use strict';
    app.spinner_save_show("Save to local storage");
    app.remove_attr_notSaved(app.div_list_secrets());
    try {
        localStorage['list_secrets'] = JSON.stringify(app.div_list_secrets().outerHTML);
    } catch (e) {
        if (e === QUOTA_EXCEEDED_ERR) {
            alert('Превышен лимит');
        }
    }
    app.spinner_save_none();
};

app.load_div_list_secrets_from_localStorage = function () {
    'use strict';
    if (localStorage['list_secrets']) {
        let wrap = document.createElement('div');
        wrap.innerHTML = JSON.parse(localStorage['list_secrets']);
        app.div_list_secrets().outerHTML = wrap.innerHTML;
        copy_div_attributes(wrap, app.div_list_secrets());
        app.debugLog("  load from localStorage['list_secrets']");
        app.debugLog("  data-lastchange in list_secrets:" + app.div_list_secrets().getAttribute('data-lastchange'));

        wrap.remove();
    }
};


// сортировка секретов по полю SecretName по алфавиту
// отзывчивая
// сортировка секретов
app.sorting_secrets_abc = function () {
    'use strict';
    app.clear_view_secrets();
    progress_bar.init('Sorting...');

    // функция, вызываемая после завершения обработки
    function done() {
        //console.log("Готово");
        progress_bar.log('<br>Done.');
        progress_bar.hide();
        app.search_header_input();
        app.recreate_view_secrets();
    }

    let children = app.div_list_secrets().children;
    // количество секретов
    let len_div_list_secrets = app.div_list_secrets().childElementCount;

    /**
     * Поменять местами <div>'ы
     * @param {object} div1 - 1-й <div>
     * @param {object} div2 - 2-й <div>
     */
    function chg(div1, div2) {
        let new_div1 = div1.cloneNode(true);
        let new_di2 = div2.cloneNode(true);
        div2.parentNode.insertBefore(new_div1, div2);
        div1.parentNode.insertBefore(new_di2, div1);
        div1.parentNode.removeChild(div1);
        div2.parentNode.removeChild(div2);
    }

    /**
     * Сортировка текущего секрета
     * @param {number} current - номер текущего секрета
     */
    function sort_current(current) {
        let dd1, dd2, j, new_current = current;
        for (j = current + 1; j < len_div_list_secrets; j++) {
            dd1 = children[new_current];
            dd2 = children[j];
            if (compareSecrets(dd1, dd2)) {
                new_current = j;
            }
        }
        if (current !== new_current) {
            dd1 = children[current];
            dd2 = children[new_current];
            chg(dd1, dd2);
        }
    }

    const maxtime = 100; // время обработки блоков массива
    const delay = 20; // задержка между двумя процессами обработки блоков
    let i = 0;
    progress_bar.log('<br>All secrets:' + len_div_list_secrets + ' secrets.<br>');
    setTimeout(function tick() {
        let endtime = +new Date() + maxtime;
        do {
            sort_current(++i);
            progress_bar.log(i + ', ');
            //            console.log(i);
        } while (len_div_list_secrets - i > 0 && endtime > +new Date());

        progress_bar.value(100 * i / len_div_list_secrets);
        //console.log('len_div_list_secrets-i' + len_div_list_secrets - i);
        if (len_div_list_secrets - i > 0) {
            setTimeout(tick, delay, i);
        } else {
            done();
        }
    }, delay);
    app.recreate_view_secrets();
};


/**
 * записываем страницу в файл
 */
app.save_as_HTML_in_file = function () {
    'use strict';
    div_hide(app.div_settings);
    app.spinner_save_show("Save local.");
    let html_page = app.construct_HTML_page_for_export(true);
    let blob = new Blob([html_page], {
        type: 'text/plain;charset=utf-8'
    });
    saveAs(blob, app.file_name_for_save());
    app.spinner_save_none();
}
// сохраняем на сервер webdav
app.save_as_HTML_file_on_webdav_server = function (callback) {
    'use strict';
    div_hide(app.div_settings);
    app.unregister_service_worker();
    app.saveFileOnWebdavServer(callback);
}

// сохранение параметров в localStorage
app.logout = function () {
    //
    if (!app.start_from_local_disk && app.need_save_value) {
        // ** локально сохраняем **
        app.save_div_list_secrets_to_localStorage();
        // сохраняем на webdrive
        app.save_as_HTML_file_on_webdav_server(
            function () {
                location.reload();
            }
        )
    } else {
        location.reload();
    }
}

// загрузка параметров
app.local_login = function (callback) {
    if (!app.start_from_local_disk) {
        clearTimeout(app.timer_every_hour);
        app.load_div_list_secrets_from_localStorage();
        if (callback) {
            callback();
        }
        // проверка где новее секрет
        //        setTimeout(
        app.check_where_newer_list_secret();
        //            1);
    } else {
        if (callback) {
            callback();
        }
    }
}
// сброс состояния notSaved
app.remove_attr_notSaved = function (div) {
    div.removeAttribute('data-notSaved');
    let i;
    for (i = 0; i < div.childElementCount; i++) {
        div.children[i].removeAttribute('data-notSaved');
    }
}

/**
 * сохраняем файл на webdav сервер
 *
 * @param {Function} callback Function to call when the request is complete.
 */
app.saveFileOnWebdavServer = function (callback) {
    'use strict';
    app.spinner_save_show("Save on server");
    div_hide(app.div_settings);
    let fileName = app.file_name_for_save();
    let html_page = app.construct_HTML_page_for_export(true);

    // сохраняем
    let client = app.webdavInitialize();
    client.PUT(app.webdavPathFolder + fileName,
        html_page,
        function () {
            app.spinner_save_none();
            location.reload();
        });
}

//Спиннер "Save"
app.spinner_save_show = function (text) {
    if (text) {
        document.getElementById("spinner_save_text").innerHTML = text;
    }
    div_show_id("spinner_save")
}
app.spinner_save_none = function () {
    div_hide_id("spinner_save");
}



function copy_div_attributes(div_source, div_target) {
    // копируем атрибуты
    for (var i = 0; i < div_source.attributes.length; i++) {
        div_target.setAttribute(div_source.attributes[i].name, div_source.attributes[i].value);
    }
}

// очистка localStorage
app.remove_local_data = function () {
    window.localStorage.clear();
    app.unregister_service_worker();
    timer_autosave_in.remove();
    div_hide(app.div_settings);
    app.div_view_secrets.style.display = 'none';
    document.getElementById('div_autosave_in').innerHTML = 'Need Reload';
    document.getElementById('secrets_and_control_element').innerHTML = '';
    //    app.spinner_save_show("Clean localStorage");
    app.spinner_save_show('<p class="warning_text"><br>' +
        'Local data removed.<br><br><br>Reload the page.</p>');
}

app.import_from_keymemo_com = function () {
    let import_from_keymemo_com_login = document.getElementById('import_from_keymemo_com_login').value.length;
    let import_from_keymemo_com_password = document.getElementById('import_from_keymemo_com_password').value.length;
    if (import_from_keymemo_com_login > 0 && import_from_keymemo_com_password > 0) {
        app.import_from_keymemo_com_button.disabled = false;
    } else {
        app.import_from_keymemo_com_button.disabled = true;
    }
}

// дерегистрация worker
app.unregister_service_worker = function () {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    })
}

function SW_putt_command(SW_command, callback) {
    if (navigator.serviceWorker.controller) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function (event) {
            //            console.log("SW->send: ", event.data.message);
            callback(event.data.message);
        }

        //        console.log("SW-> recieved");
        navigator.serviceWorker.controller.postMessage({
            "command": SW_command,
            "message": "Hi, test"
        }, [messageChannel.port2]);
        return true;
    } else {
        console.log("No active ServiceWorker");
        callback("No active ServiceWorker");
        return false;
    }
}
