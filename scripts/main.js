(function () {

    // Высота сцены
    var sceneHeight = 700;
    // Ширина сцены
    var sceneWidth = 700;
    // Размер корпуса танка
    var tankSize = 20;
    // Урон орудия танка по умолчанию
    var defaultPower = 30;
    // Максимально возможный урон от орудия танка
    var maxPower = 50;
    // Урон от орудия танка противника по умолчанию
    var enemyDefaultPower = 10;
    // Скорость перемещения танка по умолчанию
    var defaultSpeed = 3;
    // Максимально возможная скорость перемещения танка
    var maxSpeed = 10;
    // Скорость перемещения танка противника по умолчанию
    var enemyDefaultSpeed = 3;
    // Вероятность того, что противник произведет выстрел в процентах на тик (если у него уже прошла перезарядка орудия)
    var enemyShootChance = 0.3;
    // Шанс на появление бонуса в процентах на тик
    var bonusSpawnChance = 1;
    // Время перезарядки орудия в тиках
    var weaponReloadTime = 200;
    // Количество здоровья по умолчанию
    var maxHP = 100;
    // Количество противников на карте
    var enemyCount = 3;
    // Значение бонуса урона
    var bonusPower = 5;
    // Значение бонуса скорости
    var bonusSpeed = 1;


    // Объект полотна
    var canvas = document.getElementById('canvas');
    canvas.width = sceneWidth;
    canvas.height = sceneHeight;
    // Объект 2d контекста
    var context = canvas.getContext('2d');
    // Перечисление кодов клавиш
    var Key = {
        ARROW_RIGHT: 39,
        ARROW_LEFT: 37,
        ARROW_DOWN: 40,
        ARROW_UP: 38,
        SPACE: 32,
        W: 87,
        S: 83,
        A: 65,
        D: 68
    };
    // Перечисление кодов клавиш мыши
    var Mouse = {
        LEFT: 1,
        MIDDLE: 2,
        RIGHT: 3
    };
    // Перечисление направлений
    var Direction = {
        UP: 1,
        DOWN: 2,
        RIGHT: 3,
        LEFT: 4
    };
    // Типы бонусов
    var BonusType = {
        POWER: 1,
        SPEED: 2,
        HP: 3
    };

    /**
     * Описание объекта сцены
     *
     * @param context 2d контекст
     * @constructor
     */
    function Scene(context) {
        var self = this;

        self.ctx = context;
        // Массив объектов сцены
        self.objects = {};
        // Количество пройденных игровых тиков
        self.tickCount = 0;
        // Информация о том, запущен ли игровой цикл
        self.started = true;
        // Цвет накладываемого поверх холста фона при завершении игры
        self.layerColor = '#777777';
        // Количество бонусов на сцене
        self.bonusCount = 0;
        // Объект текущего бонуса
        self.currentBonus = null;
        // Количество танков на сцене
        self.tankCount = 0;

        /**
         * Добавление нового объекта на сцену
         * @param object
         */
        self.addObject = function(object) {
            var objID = self.generateID();
            object.id = objID;
            self.objects[objID] = object;
        };

        /**
         * Рендер сцены
         */
        self.render = function () {
            self.tickCount += 1;
            // Очистка сцены
            self.ctx.clearRect(0, 0, sceneWidth, sceneHeight);

            if (self.bonusCount == 0) {
                var bonusChance = randomNumber(0, 1000);
                if (bonusChance <= bonusSpawnChance * 10) {
                    self.addBonus();
                }
            }

            // Обход и рендер всех игровых объектов на сцене
            for (var objID in self.objects) {
                if (self.objects.hasOwnProperty(objID)) {
                    var obj = self.objects[objID];
                    if (obj.render !== undefined) {
                        obj.render(self, self.ctx);
                    }
                }
            }
        };

        /**
         * Добавление бонуса на сцену
         */
        self.addBonus = function() {
            var type = randomNumber(1, 4);
            var bonus = new Bonus(randomNumber(0, sceneWidth), randomNumber(0, sceneHeight), type);
            self.addObject(bonus);
            self.bonusCount += 1;
            self.currentBonus = bonus;
        };

        /**
         * Удаление бонуса со сцены
         */
        self.destroyBonus = function() {
            var bonusID = self.currentBonus.id;
            self.currentBonus = null;
            self.bonusCount -= 1;
            self.destroyById(bonusID);
        };

        /**
         * Удаление объекта с указанным id со сцены
         * @param objectID
         */
        self.destroyById = function(objectID) {
            if (self.objects[objectID] !== undefined) {
                delete self.objects[objectID];
            }
        };

        /**
         * Генерация UUID
         * @returns {string}
         */
        self.generateID = function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        };

        /**
         * Игровой цикл
         */
        self.gameLoop = function() {
            self.render();
            if (self.started) {
                window.requestAnimationFrame(self.gameLoop);
            } else {
                self.ctx.fillStyle = self.layerColor;
                self.ctx.fillRect(0, 0, sceneWidth, sceneHeight);
            }
        };

        /**
         * Остановка игрового цикла
         */
        self.stop = function(color) {
            if (color !== undefined) {
                self.layerColor = color;
            }
            self.started = false;
        };

        /**
         * Запуск игрового цикла
         */
        self.start = function() {
            self.started = true;
        };
    }

    /**
     * Описание объекта игрового персонажа
     *
     * @param x Координата X
     * @param y Координата Y
     * @param target Объект, возвращающий координаты точки-цели для орудия.
     *               Данный объект должен содержать атрибуты x и y.
     * @param color Цвет объекта
     * @param options Дополнительные параметры объекта
     * @constructor
     */
    function Tank(x, y, target, color, options) {
        var self = this;

        options = options || {};

        self.id = null;
        // Текущие координаты персонажа
        self.x = x;
        self.y = y;
        // Мишень для орудия
        self.target = target;
        // Скорость передвижения персонажа (за тик)
        self.speed = options.speed || defaultSpeed;
        // Размер корпуса персонажа
        self.size = options.size || tankSize;
        // Время последнего выстрела
        self.lastFireTime = 0;
        // Время перезарядки оружия (в тиках)
        self.weaponReloadTime = options.weaponReloadTime || weaponReloadTime;
        // Кастомная логика сущности. Функция, вызываемая на каждом тике.
        // Получает на вход 3 параметра - объект сущности, объект сцены и объект 2d контекста.
        self.customLogic = options.customLogic || null;
        // Цвет корпуса
        self.color = color || '#00cc00';
        // Максимальное количество здоровья
        self.maxHP = options.maxHP || maxHP;
        // Текущее количество здоровья
        self.currentHP = self.maxHP;
        // Время последнего обновления объекта
        self.lastUpdate = 0;
        // Сила урона орудия танка
        self.power = options.power || defaultPower;

        /**
         * Рендер персонажа
         * @param scene Объект сцены
         * @param ctx 2d контекст
         */
        self.render = function(scene, ctx) {
            // Уничтожение объекта при окончании его здоровья
            if (self.currentHP <= 0) {
                scene.destroyById(self.id);

                if (self != player) {
                    scene.tankCount -= 1;
                    if (scene.tankCount == 0) {
                        scene.stop('#00ff00');
                    }
                } else {
                    scene.stop('#ff0000');
                }

                return;
            }

            self.checkBonus(scene);

            // Обработка дополнительной логики (если определена)
            if (self.customLogic) {
                self.customLogic(self, scene, ctx);
            }

            self.renderBody(ctx);
            self.renderWeapon(ctx);
            self.renderReloadProgressBar(ctx, scene);
            self.renderHPProgressBar(ctx);
        };

        /**
         * Проверка на пересечение с бонусом
         * @param scene Объект игровой сцены
         */
        self.checkBonus = function(scene) {
            if (scene.currentBonus && distanceToObject(self, scene.currentBonus) <= self.size) {
                scene.currentBonus.onPick(self);
                scene.destroyBonus();
            }
        };

        /**
         * Рендер тела корпуса
         * @param ctx 2d контекст
         */
        self.renderBody = function(ctx) {
            ctx.beginPath();
            ctx.arc(self.x, self.y, self.size, 0, Math.PI * 2, false);
            ctx.fillStyle = self.color;
            ctx.fill();
        };

        /**
         * Рендер оружия
         * @param ctx 2d контекст
         */
        self.renderWeapon = function(ctx) {
            var point = self.calculatePoint();

            ctx.beginPath();
            ctx.moveTo(self.x, self.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        };

        /**
         * Рендер прогресса перезарядки орудия
         * @param ctx 2d контекст
         * @param scene Объект сцены
         */
        self.renderReloadProgressBar = function(ctx, scene) {
            // Максимальная длина прогрессбара
            var fullProgressLength = self.size * 2 + 10;
            // Текущая длина прогрессбара
            var currentProgressLength;

            // Если выстрелов еще не было, то шкала перезарядки будет полной сразу
            if (self.lastFireTime == 0) {
                currentProgressLength = fullProgressLength;
            } else {
                currentProgressLength = calculateLength(
                    scene.tickCount - self.lastFireTime,
                    self.weaponReloadTime,
                    fullProgressLength);
            }

            // Шкала не может быть больше максимального положения
            if (currentProgressLength >= fullProgressLength) {
                currentProgressLength = fullProgressLength;
            }

            // Рендер обводки прогрессбара
            ctx.rect(self.x - self.size - 5, self.y + self.size + 5, fullProgressLength, 3);
            ctx.stroke();

            // Рендер текущего значения прогрессбара
            ctx.fillStyle = '#0000cc';
            ctx.fillRect(self.x - self.size - 5, self.y + self.size + 5, currentProgressLength, 3);
        };

        /**
         * Рендер прогрессбара с уровнем здоровья
         * @param ctx 2d контекст
         */
        self.renderHPProgressBar = function(ctx) {
            // Максимальная длина прогрессбара
            var fullProgressLength = self.size * 2 + 10;
            // Текущая длина прогрессбара
            var currentProgressLength = calculateLength(self.currentHP, self.maxHP, fullProgressLength);

            // Шкала не может быть больше максимального положения
            if (currentProgressLength >= fullProgressLength) {
                currentProgressLength = fullProgressLength;
            }

            // Рендер обводки прогрессбара
            ctx.rect(self.x - self.size - 5, self.y - self.size - 10, fullProgressLength, 3);
            ctx.stroke();

            // Рендер текущего значения прогрессбара
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(self.x - self.size - 5, self.y - self.size - 10, currentProgressLength, 3);
        };

        /**
         * Расчет точки кончика оружия
         * @returns {{x: *, y: *}}
         */
        self.calculatePoint = function() {
            var x = self.x + (self.size + 20) * (self.target.x - self.x) / Math.sqrt(Math.pow(self.target.x - self.x, 2) + Math.pow(self.target.y - self.y, 2));
            var y = self.y + (self.size + 20) * (self.target.y - self.y) / Math.sqrt(Math.pow(self.target.x - self.x, 2) + Math.pow(self.target.y - self.y, 2));

            return {x: x, y: y};
        };

        /**
         * Произведение выстрела из орудия
         * @param scene
         */
        self.fire = function (scene) {
            if (self.lastFireTime == 0 || self.lastFireTime + self.weaponReloadTime <= scene.tickCount) {
                self.spawnBullet(scene);
                self.lastFireTime = scene.tickCount;
            }
        };

        /**
         * Создание объекта снаряда
         */
        self.spawnBullet = function(scene) {
            var spawnPosition = self.calculatePoint();
            var bullet = new Bullet(spawnPosition.x, spawnPosition.y, self.target.x, self.target.y, self.power, self);
            scene.addObject(bullet);
        };

        /**
         * Проверка на столкновения с другими объектами
         * @param scene Объект сцены
         * @param direction Направление перемещения
         * @returns {boolean}
         */
        self.checkCollision = function(scene, direction) {
            var result = true;

            for (var objID in scene.objects) {
                if (scene.objects.hasOwnProperty(objID)) {
                    var obj = scene.objects[objID];
                    if (obj == self) {
                        continue;
                    }

                    var differenceX = self.x - obj.x;
                    var differenceY = self.y - obj.y;
                    var betweenDistance = self.size + obj.size;
                    var hasMove = Math.abs(differenceY) <= betweenDistance && Math.abs(differenceX) < betweenDistance;

                    if (direction == Direction.UP) {
                        result = !(differenceY > 0 && hasMove);
                    } else if (direction == Direction.DOWN) {
                        result = !(differenceY < 0 && hasMove);
                    } else if (direction == Direction.LEFT) {
                        result = !(differenceX > 0 && hasMove);
                    } else if (direction == Direction.RIGHT) {
                        result = !(differenceX < 0 && hasMove);
                    }

                    if (!result) {
                        return result;
                    }
                }
            }

            return result;
        };

        /**
         * Получение объектом урона
         * @param attacker Объект, нанесший урон
         * @param power Сила нанесенного урона
         */
        self.hit = function(attacker, power) {
            self.currentHP -= power;
            if (self.currentHP <= 0) {
                self.currentHP = 0;
            }
        }
    }

    /**
     * Описание объекта снаряда
     *
     * @param x1 Координата X (точка образования снаряда)
     * @param y1 Координата Y (точка образования снаряда)
     * @param x2 Координата X (конечная точка снаряда)
     * @param y2 Координата Y (конечная точка снаряда)
     * @param power Мощность урона снаряда
     * @param owner Владелец снаряда
     * @constructor
     */
    function Bullet(x1, y1, x2, y2, power, owner) {
        var self = this;

        self.id = null;
        // Текущие координаты снаряда
        self.x = x1;
        self.y = y1;
        // Начальные координаты снаряда
        self.x1 = x1;
        self.y1 = y1;
        // Конечные координаты снаряда
        self.x2 = x2;
        self.y2 = y2;
        // Скорость движения снаряда
        self.speed = 10;
        // Пройденное снарядом расстояние
        self.distance = 0;
        // Мощность наносимого снарядом урона
        self.power = power;
        // Объект, выпустивший снаряд
        self.owner = owner;

        /**
         * Рендер снаряда
         * @param scene Объект сцены
         * @param ctx 2d контекст
         */
        self.render = function(scene, ctx) {
            // Увеличиваем пройденное снарядом расстояние
            self.distance += self.speed;

            // Если снаряд вышел за пределы сцены, то уничтожаем его
            if (self.x <= 0 || self.x >= sceneWidth || self.y <= 0 || self.y >= sceneHeight) {
                scene.destroyById(self.id);
            }

            // Рассчитываем актуальные координаты снаряда
            var position = self.calculatePosition();
            self.x = position.x;
            self.y = position.y;

            // Проверяем столкновения со всеми объектами сцены
            for (var objID in scene.objects) {
                if (scene.objects.hasOwnProperty(objID)) {
                    var obj = scene.objects[objID];
                    if (obj == self || !(obj instanceof Tank)) {
                        continue;
                    }

                    if (distanceToObject(self, obj) <= obj.size) {
                        obj.hit(self.owner, self.power);
                        scene.destroyById(self.id);
                        return;
                    }
                }
            }

            // Отрисовываем снаряд
            ctx.beginPath();
            ctx.arc(self.x, self.y, 5, 0, Math.PI * 2, false);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        };

        /**
         * Расчет текущей координаты снаряда
         * @returns {{x: *, y: *}}
         */
        self.calculatePosition = function() {
            var x = self.x1 + self.distance * (self.x2 - self.x1) / Math.sqrt(Math.pow(self.x2 - self.x1, 2) + Math.pow(self.y2 - self.y1, 2));
            var y = self.y1 + self.distance * (self.y2 - self.y1) / Math.sqrt(Math.pow(self.x2 - self.x1, 2) + Math.pow(self.y2 - self.y1, 2));

            return {x: x, y: y};
        };
    }

    /**
     * Описание объекта бонуса
     * @param x Координата X
     * @param y Координата Y
     * @param type Тип бонуса (из перечисления BonusType)
     * @constructor
     */
    function Bonus(x, y, type) {
        var self = this;

        self.x = x;
        self.y = y;
        self.type = type;
        self.color = null;

        if (type == BonusType.POWER) {
            self.color = '#0000ff';
        } else if (type == BonusType.SPEED) {
            self.color = '#00ff00';
        } else if (type == BonusType.HP) {
            self.color = '#ff0000';
        }

        /**
         * Рендер бонуса
         * @param scene
         * @param ctx
         */
        self.render = function(scene, ctx) {
            ctx.fillStyle = self.color;
            ctx.fillRect(self.x - 5, self.y - 5, 10, 10);
        };

        /**
         * Подбор бонуса
         * @param picker Объект, подобравший бонус
         */
        self.onPick = function(picker) {
            switch (self.type) {
                // Бонус Силы - повышает урон на 5
                case BonusType.POWER:
                    if (picker.power + bonusPower < maxPower) {
                        picker.power += bonusPower;
                    } else {
                        picker.power = maxPower;
                    }
                    break;
                // Бонус Скорости - повышает скорость на 1
                case BonusType.SPEED:
                    if (picker.speed + bonusSpeed < maxSpeed) {
                        picker.speed += bonusSpeed;
                    } else {
                        picker.speed = maxSpeed;
                    }
                    break;
                // Бонус Здоровья - восстанавливает здоровье
                case BonusType.HP:
                    picker.currentHP = picker.maxHP;
            }
        };
    }

    /**
     * Обработка событий нажатия клавиш
     * @param event
     */
    document.onkeydown = movePlayer;
    document.onkeyup = movePlayer;

    /**
     * Обработка нажатий клавиш мыши
     * @param event
     */
    canvas.onmousedown = function(event) {
        switch (event.which) {
            // Выстрел из основного орудия
            case Mouse.LEFT:
                player.fire(scene);
                break;
        }
    };

    /**
     * Обработка события перемещения курсора
     * @param event
     */
    canvas.onmousemove = function(event) {
        mousePosition.x = event.pageX - this.offsetLeft;
        mousePosition.y = event.pageY - this.offsetTop;
    };

    /**
     * Перемещение персонажа
     * @param event
     */
    function movePlayer(event) {
        var keyCode = event.keyCode;

        switch (keyCode) {
            // Перемещение вправо
            case Key.D:
            case Key.ARROW_RIGHT:
                if (player.checkCollision(scene, Direction.RIGHT)) {
                    (player.x + player.size < sceneWidth) ? player.x += player.speed : player.x = sceneHeight - player.size;
                }
                break;
            // Перемещение влево
            case Key.A:
            case Key.ARROW_LEFT:
                if (player.checkCollision(scene, Direction.LEFT)) {
                    (player.x - player.size > 0) ? player.x -= player.speed : player.x = player.size;
                }
                break;
            // Перемещение вниз
            case Key.S:
            case Key.ARROW_DOWN:
                if (player.checkCollision(scene, Direction.DOWN)) {
                    (player.y + player.size < sceneWidth) ? player.y += player.speed : player.y = sceneHeight - player.size;
                }
                break;
            // Перемещение вверх
            case Key.W:
            case Key.ARROW_UP:
                if (player.checkCollision(scene, Direction.UP)) {
                    (player.y - player.size > 0) ? player.y -= player.speed : player.y = player.size;
                }
                break;
            // Выстрел из основного орудия
            case Key.SPACE:
                player.fire(scene);
                break;
        }
    }

    /**
     * Случайное число в заданном диапазоне
     * @param min Минимально возможное число
     * @param max Максимально возможное число
     * @returns {*}
     */
    function randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Расчет длины значения прогрессбара
     * @param currentValue Текущее значение
     * @param maxValue Максимальное значение
     * @param maxLength Длина прогрессбара для максимального значения
     * @returns {number}
     */
    function calculateLength(currentValue, maxValue, maxLength) {
        var onePercent = 100.0 / maxValue;
        var currentProgressPercent = currentValue * onePercent;

        return maxLength / (100.0 / currentProgressPercent);
    }

    /**
     * Измерение расстояния между объектами
     * @param obj1 Первый объект
     * @param obj2 Второй объект
     * @returns {number}
     */
    function distanceToObject(obj1, obj2) {
        return Math.sqrt(Math.pow(Math.abs(obj1.x - obj2.x), 2) + Math.pow(Math.abs(obj1.y - obj2.y), 2));
    }

    /**
     * Логика противников
     * @param obj Объект персонажа
     * @param scene Игровая сцена
     */
    function enemyLogic(obj, scene) {
        // Выполняем логику только через один тик
        if (obj.lastUpdate + 2 > scene.tickCount) {
            return;
        }

        // Если на сцене есть бонус, то он приоритетная цель для всех персонажей
        if (scene.bonusCount > 0 && scene.currentBonus) {
            obj.targetPosition = scene.currentBonus
        }
        // Если у персонажа нет цели или он достиг ее, то даем ему новую цель
        else if (obj.targetPosition === undefined || (obj.x == obj.targetPosition.x && obj.y == obj.targetPosition.y)) {
            obj.targetPosition = {x: randomNumber(0, sceneWidth), y: randomNumber(0, sceneHeight)};
        }

        // Обработка перемещения по оси X
        if (obj.x < obj.targetPosition.x) {
            obj.x = (obj.x + obj.speed <= obj.targetPosition.x) ? obj.x += obj.speed : obj.targetPosition.x;
        } else if (obj.x > obj.targetPosition.x) {
            obj.x = (obj.x - obj.speed >= obj.targetPosition.x) ? obj.x -= obj.speed : obj.targetPosition.x;
        }
        // Обработка перемещения по оси Y
        else if (obj.y < obj.targetPosition.y) {
            obj.y = (obj.y + obj.speed <= obj.targetPosition.y) ? obj.y += obj.speed : obj.targetPosition.y;
        } else if (obj.y > obj.targetPosition.y) {
            obj.y = (obj.y - obj.speed >= obj.targetPosition.y) ? obj.y -= obj.speed : obj.targetPosition.y;
        }

        // Рассчитываем вероятность произвести выстрел
        var hasFire = randomNumber(0, 1000);
        // Производим выстрел с шансом 0.1% на тик, только если у нас прошла задержка перед предыдущим выстрелом
        if (hasFire <= enemyShootChance * 10 && (obj.lastFireTime == 0 || obj.lastFireTime + obj.weaponReloadTime <= scene.tickCount)) {
            obj.fire(scene);
        }

        obj.lastUpdate = scene.tickCount;
    }

    // Объект, содержащий актуальные координаты курсора
    var mousePosition = {x: 0, y: 0};

    // Создание объекта сцены
    var scene = new Scene(context);
    // Создание объекта персонажа
    var player = new Tank(100, 100, mousePosition);
    // Добавление персонажа на сцену
    scene.addObject(player);

    // Добавляем противников
    for (var i = 0; i < enemyCount; i++) {
        var enemy = new Tank(
            randomNumber(player.size, sceneWidth - player.size),
            randomNumber(player.size, sceneHeight - player.size),
            player,
            '#cc43ae',
            {customLogic: enemyLogic, power: enemyDefaultPower, speed: enemyDefaultSpeed}
        );
        scene.addObject(enemy);
        scene.tankCount += 1;
    }

    // Запуск игрового цикла
    scene.gameLoop();

} ());