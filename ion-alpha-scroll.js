angular.module('ion-alpha-scroll', [])
  .directive('ionAlphaScroll', [
    '$ionicScrollDelegate', '$location', '$timeout', '$document', '$ionicPosition', '$filter',
    function ($ionicScrollDelegate, $location, $timeout, $document, $ionicPosition, $filter) {
      return {
        require: '?ngModel',
        restrict: 'E',
        replace: true,
        compile: function (tElement, tAttrs, tTransclude) {
          var children = tElement.contents();
          var templateElements = [
            '<ion-list class="ion_alpha_list_outer">',
            '<ion-scroll overflow-scroll="false" delegate-handle="alphaScroll">',
            '<div collection-repeat="item in sorted_items" item-height="item.isDivider ? dividerHeight : itemHeight" class="ion_alpha_list">',
            '<ion-item class="item item-divider" ng-if="item.isDivider">{{item.letter}}</ion-item>',
            '<ion-item ng-class="{true: itemStyle}[true]" ng-if="!item.isDivider"></ion-item>',
            '</div>',
            '</ion-scroll>',
            '<ul class="ion_alpha_sidebar" on-drag-start="alphaSwipeStart()" on-drag="alphaSwipeGoToList($event)" on-drag-end="alphaSwipeEnd()">',
            '<li ng-click="alphaScrollGoToList(\'{{letter}}\')" ng-repeat="letter in alphabet | orderBy: letter">{{ letter }}</li>',
            '</ul>',
            '</ion-list>'
          ];
          var refresher = angular.fromJson(tAttrs.refresher);
          if (refresher) {
            var refresherElement = '<ion-refresher pulling-text="' + refresher.text + '" on-refresh="' + refresher.callback + '"> </ion-refresher>';
            templateElements.splice(2, 0, refresherElement);
          }
          var template = angular.element(templateElements.join(''));

          var headerHeight = $document[0].body.querySelector('.bar-header').offsetHeight;
          var subHeaderHeight = tAttrs.subheader === "true" ? 44 : 0;
          var tabHeight = $document[0].body.querySelector('.tab-nav') ? $document[0].body.querySelector('.tab-nav').offsetHeight : 0;
          var windowHeight = window.innerHeight;

          var topHeight = headerHeight + subHeaderHeight + tabHeight;
          var contentHeight = windowHeight - topHeight;

          angular.element(template.find('ion-item')[1]).append(children);
          tElement.html('');
          tElement.append(template);

          tElement.find('ion-scroll').css({
            "height": contentHeight + 'px'
          });

          var letterIndicator = angular.element('<div class="letter-indicator">A</div>');
          $document[0].body.appendChild(letterIndicator[0]);

          var indicatorIsShow = false;
          function indicatorShow(letter) {
            letterIndicator.text(letter);

            if (indicatorIsShow) {
              return;
            }

            indicatorIsShow = true;

            letterIndicator.css({
              "display": "flex"
            });
            $timeout(function () {
              var indicatorPosition = $ionicPosition.position(letterIndicator);
              letterIndicator.css({
                "z-index": 10,
                "top": (windowHeight - indicatorPosition.height) / 2 + 'px',
                "left": (window.innerWidth - indicatorPosition.width) / 2 + 'px'
              });
            }, 200);
          }

          function indicatorHide() {
            letterIndicator.css({
              "display": "none"
            });
            indicatorIsShow = false;
          }

          return function (scope, element, attrs, ngModel) {
            // do nothing if the model is not set
            if (!ngModel) return;

            scope.itemStyle = attrs.itemStyle;
            scope.dividerHeight = attrs.dividerHeight ? attrs.dividerHeight : 37;
            scope.itemHeight = attrs.itemHeight ? attrs.itemHeight : 73;
            var sidebar = $document[0].body.querySelector('.ion_alpha_sidebar');

            scope.$on('$destroy', function () {
              letterIndicator.remove();
            });

            ngModel.$render = function () {
              scope.items = ngModel.$viewValue;
              var sortedItems = $filter('orderBy')(scope.items, attrs.key);
              var tmp = {};
              for (var i = 0; i < sortedItems.length; i++) {
                var item = sortedItems[i];
                var letter = item[attrs.key].toUpperCase().charAt(0);
                if (tmp[letter] == undefined) {
                  tmp[letter] = {data: []};
                }
                tmp[letter].data.push(item);
              }

              sortedItems = [];
              var index = 0, dataSum = 0;
              angular.forEach(tmp, function (group, letter) {
                var top = 0;
                if (index > 0) {
                  dataSum += group.data.length;
                  top = index * scope.dividerHeight + dataSum * scope.itemHeight;
                }
                group['top'] = top;
                sortedItems = sortedItems.concat([{isDivider: true, letter: letter}].concat(group.data));
                index++;
              });
              scope.alphabet = iterateAlphabet(tmp);
              scope.alphabetStr = scope.alphabet.join('');
              scope.sorted_items = sortedItems;

              var isAlphaSwipe = false;

              scope.alphaSwipeStart = function () {
                isAlphaSwipe = true;
              };

              scope.alphaSwipeEnd = function () {
                isAlphaSwipe = false;
                indicatorHide();
              };

              scope.alphaSwipeGoToList = function ($event) {
                var y = $event.gesture.center.pageY - topHeight;
                if (y < 0) {
                  return;
                }

                var sidebarHeight = $ionicPosition.position(angular.element(sidebar)).height;
                var currentHeight = sidebarHeight - y;
                if (currentHeight < 0) {
                  return;
                }

                var alphabetHeight = sidebarHeight / scope.alphabet.length;
                var idx = scope.alphabet.length - parseInt(currentHeight / alphabetHeight) - 1;
                scope.alphaScrollGoToList(scope.alphabetStr.charAt(idx));
              };

              scope.alphaScrollGoToList = function (id) {
                if (id == scope.previousId) {
                  return;
                }

                if (isAlphaSwipe) {
                  indicatorShow(id);
                }

                scope.previousId = id;
                $ionicScrollDelegate.$getByHandle('alphaScroll').scrollTo(0, tmp[id].top, true);
              };

              //Create alphabet object
              function iterateAlphabet(alphabet) {
                var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                var keys = Object.keys(alphabet);
                if (keys.length != 0) {
                  str = '';
                  for (var i = 0; i < keys.length; i++) {
                    str += keys[i];
                  }
                }
                var numbers = new Array();
                for (var i = 0; i < str.length; i++) {
                  numbers.push(str.charAt(i));
                }
                return numbers;
              }
            };
          }
        }
      };
    }
  ]);