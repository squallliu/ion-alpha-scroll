angular.module('ion-alpha-scroll', ['ionic'])
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
            '<li ng-class="{\'alpha-active\': alpha.isActive}" ng-click="alphaScrollGoToList(\'{{alpha.letter}}\')" ng-repeat="alpha in alphabet">{{alpha.letter}}</li>',
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

          var topHeight = tAttrs.topHeight ? tAttrs.topHeight: headerHeight + subHeaderHeight + tabHeight;
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
            if (!ngModel) {
              return;
            }

            scope.itemStyle = attrs.itemStyle;
            scope.dividerHeight = attrs.dividerHeight ? attrs.dividerHeight : 37;
            scope.itemHeight = attrs.itemHeight ? attrs.itemHeight : 73;
            var $sidebar = angular.element($document[0].body.querySelector('.ion_alpha_sidebar'));

            function groupItems(items, groupBy) {
              var result = {};
              for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var letter = item[groupBy].toUpperCase().charAt(0);
                if (result[letter] == undefined) {
                  result[letter] = {data: []};
                }
                result[letter].data.push(item);
              }
              return result;
            }

            function unwindGroup(groups) {
              var result = [];
              var index = 0, dataSum = 0;
              angular.forEach(groups, function (group, letter) {
                var top = 0;
                if (index > 0) {
                  dataSum += group.data.length;
                  top = index * scope.dividerHeight + dataSum * scope.itemHeight;
                }
                group['top'] = top;
                result = result.concat([{isDivider: true, letter: letter}].concat(group.data));
                index++;
              });
              return result;
            }

            scope.$on('$destroy', function () {
              letterIndicator.remove();
            });

            var isAlphaSwipping = false;
            scope.alphaSwipeStart = function () {
              isAlphaSwipping = true;
            };
            scope.alphaSwipeEnd = function () {
              isAlphaSwipping = false;
              indicatorHide();
            };

            scope.alphaSwipeGoToList = function ($event) {
              var y = $event.gesture.center.pageY - topHeight;
              if (y < 0) {
                return;
              }

              var sidebarHeight = $ionicPosition.position($sidebar).height;
              var currentHeight = sidebarHeight - y;
              if (currentHeight < 0) {
                return;
              }

              var alphabetHeight = sidebarHeight / scope.alphabetStr.length;
              var idx = scope.alphabetStr.length - parseInt(currentHeight / alphabetHeight) - 1;
              scope.alphaScrollGoToList(scope.alphabetStr.charAt(idx));
            };

            //Create alphabet object
            function iterateAlphabet(alphabet) {
              var result = [];
              for (var i = 0; i < scope.alphabetStr.length; i++) {
                var letter = scope.alphabetStr.charAt(i);
                var isActive = alphabet[letter] ? true : false;
                result.push({letter: letter, isActive: isActive});
              }
              return result;
            }

            scope.alphaScrollGoToList = function (id) {
              if (id == scope.previousId) {
                return;
              }

              if (isAlphaSwipping) {
                indicatorShow(id);
              }
              
              scope.previousId = id;
              if (!scope.groups[id]) {
                return;
              }
              
              $ionicScrollDelegate.$getByHandle('alphaScroll').scrollTo(0, scope.groups[id].top, true);
            };

            scope.alphabetStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            ngModel.$render = function () {
              scope.items = ngModel.$viewValue;
              var sortedItems = $filter('orderBy')(scope.items, attrs.key);

              scope.groups = groupItems(sortedItems, attrs.key);
              scope.alphabet = iterateAlphabet(scope.groups);
              scope.sorted_items = unwindGroup(scope.groups);
            };
          }
        }
      };
    }
  ]);